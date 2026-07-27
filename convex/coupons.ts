import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const all = await ctx.db.query("coupons").collect();
    if (args.activeOnly) {
      const now = Date.now();
      return all.filter((c) => c.isActive && (!c.expiresAt || c.expiresAt > now));
    }
    return all;
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed"), v.literal("bundle")),
    value: v.number(),
    minPurchase: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .collect();
    if (existing.length > 0) {
      throw new Error(`Coupon with code "${args.code}" already exists`);
    }
    return await ctx.db.insert("coupons", {
      ...args,
      usageCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("coupons"),
    code: v.optional(v.string()),
    type: v.optional(v.union(v.literal("percentage"), v.literal("fixed"), v.literal("bundle"))),
    value: v.optional(v.number()),
    minPurchase: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const validate = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .collect();
    const coupon = results[0];
    if (!coupon) return { valid: false, error: "Coupon not found" };
    if (!coupon.isActive) return { valid: false, error: "Coupon is inactive" };
    if (coupon.expiresAt && coupon.expiresAt < Date.now()) return { valid: false, error: "Coupon has expired" };
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached" };
    }
    return { valid: true, coupon };
  },
});

export const incrementUsage = internalMutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.id);
    if (coupon) {
      await ctx.db.patch(args.id, { usageCount: coupon.usageCount + 1 });
    }
  },
});
