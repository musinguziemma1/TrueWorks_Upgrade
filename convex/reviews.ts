import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent, requireEditor } from "./users";
import { checkRateLimit } from "./rateLimit";
import { auditLog } from "./lib/audit";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

async function recalculateProductRating(ctx: any, productId: Id<"products">) {
  const approved = await ctx.db
    .query("reviews")
    .withIndex("by_productId", (q: any) => q.eq("productId", productId))
    .collect()
    .then((rs: any[]) => rs.filter((r: any) => r.status === "approved"));
  const totalRating = approved.reduce((sum: number, r: any) => sum + r.rating, 0);
  const count = approved.length;
  await ctx.db.patch(productId, {
    reviewCount: count,
    rating: count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0,
  });
}

export const list = query({
  args: {
    productId: v.optional(v.id("products")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await requireAdminSilent(ctx);
    let reviews;
    if (args.productId) {
      reviews = await ctx.db
        .query("reviews")
        .withIndex("by_productId", (q) => q.eq("productId", args.productId!))
        .collect();
    } else if (args.status) {
      reviews = await ctx.db
        .query("reviews")
        .withIndex("by_status", (q) => q.eq("status", args.status as "pending" | "approved" | "rejected"))
        .collect();
    } else {
      reviews = await ctx.db.query("reviews").order("desc").take(100);
    }
    if (!isAdmin) {
      return reviews.filter((r) => r.status === "approved");
    }
    return reviews;
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
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    await checkRateLimit(
      ctx,
      "review",
      `${args.productId}:${args.customerName.toLowerCase().trim()}`,
      3,
      3_600_000
    );

    // Verify the review is from a genuine purchaser. Only check when an email
    // is supplied and only cross-reference completed orders for that email.
    let verified = false;
    if (args.email && args.email.trim()) {
      const completed = await ctx.db
        .query("orders")
        .withIndex("by_customerEmail", (q) =>
          q.eq("customerEmail", args.email!.trim().toLowerCase())
        )
        .collect();
      verified = completed.some(
        (o) =>
          o.paymentStatus === "completed" &&
          o.items.some((it) => it.productId === args.productId)
      );
    }

    const reviewId = await ctx.db.insert("reviews", {
      productId: args.productId,
      customerId: undefined,
      customerName: args.customerName,
      rating: args.rating,
      title: args.title,
      content: args.content,
      status: "pending",
      featured: false,
      verified,
      helpfulCount: 0,
      reported: false,
      createdAt: Date.now(),
    });

    const product = await ctx.db.get(args.productId);
    if (product) {
      await ctx.runMutation(internal.notifications.createPublic, {
        type: "review",
        title: "New Review Submitted",
        message: `${args.customerName} left a ${args.rating}-star review on "${product.name}"`,
        link: "/admin/reviews",
      });
    }

    return reviewId;
  },
});

export const approve = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");
    await ctx.db.patch(args.id, { status: "approved" });
    await recalculateProductRating(ctx, review.productId);
    await auditLog(ctx, {
      action: "review.approve",
      entityType: "review",
      entityId: args.id,
      summary: `Approved review by "${review.customerName}" on product`,
    });
  },
});

export const reject = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");
    await ctx.db.patch(args.id, { status: "rejected" });
    await recalculateProductRating(ctx, review.productId);
    await auditLog(ctx, {
      action: "review.reject",
      entityType: "review",
      entityId: args.id,
      summary: `Rejected review by "${review.customerName}" on product`,
    });
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const review = await ctx.db.get(args.id);
    if (review) {
      await ctx.db.patch(args.id, { featured: !review.featured });
      await auditLog(ctx, {
        action: "review.toggle_featured",
        entityType: "review",
        entityId: args.id,
        summary: `${review.featured ? "Unfeatured" : "Featured"} review by "${review.customerName}"`,
      });
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
    await recalculateProductRating(ctx, review.productId);
    await auditLog(ctx, {
      action: "review.delete",
      entityType: "review",
      entityId: args.id,
      summary: `Deleted review by "${review.customerName}" on product`,
    });
  },
});
