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

export const listApproved = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect()
      .then((reviews) => reviews.filter((r) => r.status === "approved"));
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    customerName: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    return await ctx.db.insert("reviews", {
      productId: args.productId,
      customerId: undefined,
      customerName: args.customerName,
      rating: args.rating,
      title: args.title,
      content: args.content,
      status: "pending",
      featured: false,
      helpfulCount: 0,
      reported: false,
      createdAt: Date.now(),
    });
  },
});

export const approve = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");
    await ctx.db.patch(args.id, { status: "approved" });
    const product = await ctx.db.get(review.productId);
    if (product) {
      const approved = await ctx.db
        .query("reviews")
        .withIndex("by_productId", (q) => q.eq("productId", review.productId))
        .collect()
        .then((rs) => rs.filter((r) => r.status === "approved" || r._id === args.id));
      const totalRating = approved.reduce((sum, r) => sum + r.rating, 0);
      await ctx.db.patch(review.productId, {
        reviewCount: approved.length,
        rating: approved.length > 0 ? Math.round((totalRating / approved.length) * 10) / 10 : 0,
      });
    }
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
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");
    await ctx.db.delete(args.id);
    const product = await ctx.db.get(review.productId);
    if (product) {
      const remaining = await ctx.db
        .query("reviews")
        .withIndex("by_productId", (q) => q.eq("productId", review.productId))
        .collect()
        .then((rs) => rs.filter((r) => r._id !== args.id && r.status === "approved"));
      const totalRating = remaining.reduce((sum, r) => sum + r.rating, 0);
      await ctx.db.patch(review.productId, {
        reviewCount: remaining.length,
        rating: remaining.length > 0 ? Math.round((totalRating / remaining.length) * 10) / 10 : 0,
      });
    }
  },
});
