import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const createCheckoutOrder = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { items, customerEmail, customerName, paymentMethod, couponCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (!customerEmail || !customerName) {
      return new Response(JSON.stringify({ error: "Customer information required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await ctx.runQuery(api.products.getBySlug, { slug: item.slug });
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.slug}` }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      if (product.status !== "published") {
        return new Response(JSON.stringify({ error: `Product not available: ${product.name}` }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const price = product.salePrice ?? product.price;
      subtotal += price * item.quantity;
      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price,
      });
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

    const orderId = await ctx.runMutation(api.orders.create, {
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
    });

    if (couponCode) {
      const couponResult = await ctx.runQuery(api.coupons.validate, { code: couponCode });
      if (couponResult.valid && couponResult.coupon) {
        await ctx.runMutation(api.coupons.incrementUsage, { id: couponResult.coupon._id });
      }
    }

    await ctx.runMutation(api.customers.upsertPublic, {
      email: customerEmail,
      name: customerName,
    });

    await ctx.runMutation(api.notifications.createPublic, {
      type: "order",
      title: "New Order Received",
      message: `Order ${orderNumber} from ${customerName} for ${total.toLocaleString()}`,
      link: `/admin/orders`,
    });

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      await fetch(`${siteUrl}/api/email/order-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const message = err instanceof Error ? err.message : "Checkout failed";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
