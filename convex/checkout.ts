import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const createCheckoutOrder = httpAction(async (ctx, request) => {
  try {
    // Rate limit: max 10 checkout attempts per IP per 10 minutes
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    try {
      await ctx.runMutation(internal.rateLimit.check, {
        action: "checkout",
        identifier: ip,
        limit: 10,
        windowMs: 600_000,
      });
    } catch {
      return new Response(JSON.stringify({ error: "Too many attempts. Please try again later." }), { status: 429, headers: { "Content-Type": "application/json" } });
    }

    const body = await request.json();
    const { items, customerEmail, customerName, paymentMethod, couponCode } = body;

    let country = "";
    let region = "";
    let city = "";
    if (ip && ip !== "unknown") {
      try {
        const geoRes = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
        const geo = await geoRes.json();
        if (geo.status === "success") {
          country = geo.country || "";
          region = geo.regionName || "";
          city = geo.city || "";
        }
      } catch {
        // Geolocation failure should not block checkout
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (items.length > 50) {
      return new Response(JSON.stringify({ error: "Too many items (max 50)" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (!customerEmail || !customerName) {
      return new Response(JSON.stringify({ error: "Customer information required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // SECURITY: Validate quantity
      if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return new Response(JSON.stringify({ error: "Invalid item quantity (must be 1-100)" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      if (typeof item.slug !== "string" || !item.slug) {
        return new Response(JSON.stringify({ error: "Invalid item" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      if (item.tier !== undefined && typeof item.tier !== "string") {
        return new Response(JSON.stringify({ error: "Invalid item tier" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const product = await ctx.runQuery(api.products.getBySlug, { slug: item.slug });
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.slug}` }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      if (product.status !== "published") {
        return new Response(JSON.stringify({ error: `Product not available: ${product.name}` }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      // Resolve price server-side. If a pricing tier is requested, it MUST
      // match a valid tier on the product — never trust a client-sent price.
      let price = product.salePrice ?? product.price;
      if (item.tier && product.pricingTiers && product.pricingTiers.length > 0) {
        const tier = product.pricingTiers.find((t) => t.name === item.tier);
        if (!tier) {
          return new Response(JSON.stringify({ error: `Invalid tier for ${product.name}` }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        price = tier.salePrice ?? tier.price;
      }

      // Bunde handling: expand a bundle product into its members. Each member
      // becomes a resolved order line so downloads & fulfillment work per item.
      // Pricing is always recomputed from the database — never from the client.
      const isBundle = product.bundleProductIds && product.bundleProductIds.length > 0;
      if (isBundle) {
        for (const memberId of product.bundleProductIds!) {
          const member = await ctx.runQuery(api.products.getById, { id: memberId as any });
          if (!member || member.status !== "published") {
            return new Response(JSON.stringify({ error: `Bundle contains an unavailable product` }), { status: 400, headers: { "Content-Type": "application/json" } });
          }
          const memberPrice = member.salePrice ?? member.price;
          subtotal += memberPrice * item.quantity;
          orderItems.push({
            productId: member._id,
            productName: member.name,
            quantity: item.quantity,
            price: memberPrice,
          });
        }
      } else {
        subtotal += price * item.quantity;
        orderItems.push({
          productId: product._id,
          productName: item.tier ? `${product.name} (${item.tier})` : product.name,
          quantity: item.quantity,
          price,
        });
      }
    }

    let discountAmount = 0;
    if (couponCode) {
      const couponResult = await ctx.runQuery(api.coupons.validate, { code: couponCode });
      if (couponResult.valid && couponResult.coupon) {
        const coupon = couponResult.coupon;
        if (coupon.minPurchase && subtotal < coupon.minPurchase) {
          return new Response(JSON.stringify({ error: `Minimum purchase of ${coupon.minPurchase} required` }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (coupon.type === "percentage") {
          discountAmount = Math.round(subtotal * (coupon.value / 100));
        } else if (coupon.type === "fixed") {
          discountAmount = Math.min(coupon.value, subtotal);
        }
      } else {
        return new Response(JSON.stringify({ error: couponResult.error || "Invalid coupon" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    const orderNumber = `TW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const orderId = await ctx.runMutation(internal.orders.createInternal, {
      orderNumber,
      customerEmail,
      customerName,
      items: orderItems,
      subtotal,
      tax: 0,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      total,
      paymentMethod: paymentMethod || "card",
      paymentStatus: "pending",
      orderStatus: "pending",
      downloadLinks: [],
      couponCode: couponCode || undefined,
      ipAddress: ip !== "unknown" ? ip : undefined,
      country: country || undefined,
      region: region || undefined,
      city: city || undefined,
    });

    if (couponCode) {
      const couponResult = await ctx.runQuery(api.coupons.validate, { code: couponCode });
      if (couponResult.valid && couponResult.coupon) {
        await ctx.runMutation(internal.coupons.incrementUsage, { id: couponResult.coupon._id });
      }
    }

    await ctx.runMutation(internal.customers.upsertPublic, {
      email: customerEmail,
      name: customerName,
    });

    await ctx.runMutation(internal.notifications.createPublic, {
      type: "order",
      title: "New Order Received",
      message: `Order ${orderNumber} from ${customerName} for ${total.toLocaleString()}`,
      link: `/admin/orders`,
    });

    try {
      // Server-to-server call to the Convex site URL with the shared secret.
      // CONVEX_SITE_URL is set automatically by Convex in the action env.
      const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";
      const emailSecret = process.env.EMAIL_API_SECRET ?? "";
      if (siteUrl && emailSecret) {
        await fetch(`${siteUrl}/email/order-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-email-secret": emailSecret,
          },
          body: JSON.stringify({
            orderNumber,
            customerEmail,
            customerName,
            items: orderItems.map((item) => ({
              name: item.productName,
              quantity: item.quantity,
              price: item.price,
            })),
            total,
          }),
        });
      }
    } catch {
      // Email failure should not block checkout
    }

    return new Response(JSON.stringify({
      success: true,
      orderId,
      orderNumber,
      total,
      discountAmount,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    // SECURITY: Never leak internal error details
    return new Response(JSON.stringify({ error: "Checkout failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
