import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Shared settlement helpers used by both payment providers (Pesapal, Stripe).
 *
 * Sales counts, customer lifetime stats and coupon usage are only touched when
 * a payment actually settles (completed) or is reversed (refunded) — never at
 * checkout, so abandoned orders don't inflate the numbers.
 */

/** Add/remove settled sales for an order's items (delta = +1 or -1). */
export const adjustSales = internalMutation({
  args: {
    items: v.array(v.object({ productId: v.id("products"), quantity: v.number() })),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      const next = Math.max(0, (product.totalSales ?? 0) + args.delta * (item.quantity || 1));
      if (next === product.totalSales) continue;
      await ctx.db.patch(item.productId, { totalSales: next, updatedAt: now });
    }
  },
});

/** Adjust a customer's lifetime stats when a payment settles or is refunded. */
export const adjustCustomerStats = internalMutation({
  args: { email: v.string(), amount: v.number(), delta: v.number() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!customer) return;
    await ctx.db.patch(customer._id, {
      totalOrders: Math.max(0, (customer.totalOrders ?? 0) + args.delta),
      lifetimeValue: Math.max(0, (customer.lifetimeValue ?? 0) + args.delta * args.amount),
      updatedAt: Date.now(),
    });
  },
});

/** Adjust a coupon's usage count when a payment settles or is refunded. */
export const adjustCouponUsage = internalMutation({
  args: { code: v.string(), delta: v.number() },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!coupon) return;
    const next = Math.max(0, (coupon.usageCount ?? 0) + args.delta);
    if (next === coupon.usageCount) return;
    await ctx.db.patch(coupon._id, { usageCount: next });
  },
});

/** Revoke all downloads + licenses granted by a (refunded) order. */
export const revokeFulfillment = internalMutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const downloads = await ctx.db
      .query("downloads")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const d of downloads) {
      await ctx.db.patch(d._id, { status: "disabled", revoked: true });
    }
    const licenses = await ctx.db
      .query("licenses")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const l of licenses) {
      await ctx.db.patch(l._id, { status: "revoked" });
    }
  },
});
