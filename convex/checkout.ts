import { ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const createCheckoutOrder = async (ctx: ActionCtx, request: Request): Promise<Response> => {
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

    // SECURITY: The customer must be signed in to complete checkout. The
    // Convex token from the Authorization header (issued by the first-party
    // IAM JWKS endpoint) resolves to the user identity below. The order's
    // email is bound to this identity, never to client-supplied values.
    let identity = null;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch {
      identity = null;
    }
    if (!identity || !identity.email) {
      return new Response(JSON.stringify({ error: "You must be signed in to complete checkout" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const body = await request.json();
    const { items, customerEmail, customerName, paymentMethod, couponCode, billingAddress, currency } = body;
    const orderCurrency = typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : "USD";

    // The submitted email must match the authenticated user's email. This
    // prevents creating orders on behalf of another account.
    if (typeof customerEmail === "string" && customerEmail.toLowerCase() !== identity.email.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Checkout email must match your signed-in account" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
    const verifiedEmail = identity.email;
    const verifiedName = (typeof customerName === "string" && customerName.trim()) || identity.name || "Customer";

    let country = "";
    let region = "";
    let city = "";
    let street = "";
    let postalCode = "";
    // Customer-entered address wins for geographic tracking; IP geolocation is
    // only a fallback when the customer does not supply an address.
    if (billingAddress && typeof billingAddress === "object") {
      const addr = billingAddress as Record<string, unknown>;
      country = typeof addr.country === "string" ? addr.country : "";
      region = typeof addr.state === "string" ? addr.state : "";
      city = typeof addr.city === "string" ? addr.city : "";
      street = typeof addr.street === "string" ? addr.street : "";
      postalCode = typeof addr.postalCode === "string" ? addr.postalCode : "";
    }
    if ((!country || !city) && ip && ip !== "unknown") {
      try {
        // ipwho.is is used because it offers a free HTTPS endpoint (ip-api.com's
        // free tier is HTTP-only and blocked in browser/server HTTPS contexts).
        const geoRes = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
        const geo = await geoRes.json();
        if (geo.success === true) {
          if (!country) country = typeof geo.country === "string" ? geo.country : "";
          if (!region) region = typeof geo.region === "string" ? geo.region : "";
          if (!city) city = typeof geo.city === "string" ? geo.city : "";
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
    if (!verifiedEmail || !verifiedName) {
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
          const member = await ctx.runQuery(api.products.getById, { id: memberId });
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
      const couponResult = await ctx.runMutation(api.coupons.validateAndIncrement, { code: couponCode });
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

    const taxRateSetting = await ctx.runQuery(internal.settings.getInternal, { key: "taxRate" });
    const taxAutoCalculateSetting = await ctx.runQuery(internal.settings.getInternal, { key: "taxAutoCalculate" });
    const taxRate = typeof taxRateSetting === "number" ? taxRateSetting : 18;
    const taxAutoCalculate = typeof taxAutoCalculateSetting === "boolean" ? taxAutoCalculateSetting : true;
    const tax = taxAutoCalculate ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
    const totalWithTax = Math.round((subtotal - discountAmount + tax) * 100) / 100;

    const orderNumber = `TW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const billing =
      street || city || region || country || postalCode
        ? { street, city, state: region, country, postalCode }
        : undefined;

    const orderId = await ctx.runMutation(internal.orders.createInternal, {
      orderNumber,
      customerEmail: verifiedEmail,
      customerName: verifiedName,
      items: orderItems,
      subtotal,
      tax,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      total: totalWithTax,
      paymentMethod: paymentMethod || "card",
      paymentStatus: "pending",
      orderStatus: "pending",
      downloadLinks: [],
      couponCode: couponCode || undefined,
      ipAddress: ip !== "unknown" ? ip : undefined,
      country: country || undefined,
      region: region || undefined,
      city: city || undefined,
      currency: orderCurrency,
      billingAddress: billing,
    });

    await ctx.runMutation(internal.customers.upsertPublic, {
      email: verifiedEmail,
      name: verifiedName,
    });

    await ctx.runMutation(internal.notifications.createPublic, {
      type: "order",
      title: "New Order Received",
      message: `Order ${orderNumber} from ${verifiedName} for ${totalWithTax.toLocaleString()}`,
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
              customerEmail: verifiedEmail,
              customerName: verifiedName,
              items: orderItems.map((item) => ({
                name: item.productName,
                quantity: item.quantity,
                price: item.price,
              })),
              subtotal,
              tax,
              total: totalWithTax,
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
      total: totalWithTax,
      tax,
      discountAmount,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    // SECURITY: Never leak internal error details
    return new Response(JSON.stringify({ error: "Checkout failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
