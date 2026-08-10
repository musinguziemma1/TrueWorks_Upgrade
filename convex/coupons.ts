import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent, requireEditor } from "./users";
import { auditLog } from "./lib/audit";

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
    await requireEditor(ctx);
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .collect();
    if (existing.length > 0) {
      throw new Error(`Coupon with code "${args.code}" already exists`);
    }
    const id = await ctx.db.insert("coupons", {
      ...args,
      usageCount: 0,
      createdAt: Date.now(),
    });
    await auditLog(ctx, {
      action: "coupon.create",
      entityType: "coupon",
      entityId: id,
      summary: `Created coupon "${args.code}" (${args.type} ${args.value})`,
    });
    return id;
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
    await requireEditor(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const old = await ctx.db.get(id);
    await ctx.db.patch(id, filtered);
    await auditLog(ctx, {
      action: "coupon.update",
      entityType: "coupon",
      entityId: id,
      summary: `Updated coupon "${old?.code ?? id}"`,
      changes: filtered,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const coupon = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await auditLog(ctx, {
      action: "coupon.delete",
      entityType: "coupon",
      entityId: args.id,
      summary: `Deleted coupon "${coupon?.code ?? args.id}"`,
    });
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

