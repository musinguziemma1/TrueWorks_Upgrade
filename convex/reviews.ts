import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const list = query({
  args: {
    productId: v.optional(v.id("products")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.productId) {
      return await ctx.db
        .query("reviews")
        .withIndex("by_productId", (q) => q.eq("productId", args.productId!))
        .collect();
    }
    if (args.status) {
      return await ctx.db
        .query("reviews")
        .withIndex("by_status", (q) => q.eq("status", args.status as "pending" | "approved" | "rejected"))
        .collect();
    }
    return await ctx.db.query("reviews").order("desc").take(100);
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reviews", {
      ...args,
      status: "pending",
      featured: false,
      createdAt: Date.now(),
    });
  },
});

export const approve = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: "approved" });
  },
});

export const reject = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: "rejected" });
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(args.id);
    if (review) {
      await ctx.db.patch(args.id, { featured: !review.featured });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
