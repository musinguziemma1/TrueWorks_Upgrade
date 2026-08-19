import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { auditLog } from "./lib/audit";

/**
 * GDPR Data Export: Returns all data associated with the current user.
 * Users can request a copy of their personal data.
 */
export const exportMyData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const email = user.email.toLowerCase();

    // Gather all data associated with this user
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    const [orders, downloads, reviews, cart, returns, subscriber] = await Promise.all([
      // Orders by email
      ctx.db
        .query("orders")
        .withIndex("by_customerEmail", (q) => q.eq("customerEmail", email))
        .collect(),
      // Downloads by email
      ctx.db
        .query("downloads")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect(),
      // Reviews by customer ID (if linked)
      customer
        ? ctx.db
            .query("reviews")
            .withIndex("by_customerId", (q) => q.eq("customerId", customer._id))
            .collect()
        : [],
      // Cart by Clerk ID
      ctx.db
        .query("carts")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId ?? ""))
        .first(),
      // Returns by Clerk ID
      ctx.db
        .query("returns")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId ?? ""))
        .collect(),
      // Newsletter subscription by email
      ctx.db
        .query("subscribers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first(),
    ]);

    return {
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        items: o.items,
        total: o.total,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        createdAt: o.createdAt,
      })),
      downloads: downloads.map((d) => ({
        productId: d.productId,
        downloadCount: d.downloadCount,
        expiresAt: d.expiresAt,
        status: d.status,
        createdAt: d.createdAt,
      })),
      reviews: reviews.map((r) => ({
        productId: r.productId,
        rating: r.rating,
        title: r.title,
        content: r.content,
        status: r.status,
        createdAt: r.createdAt,
      })),
      customer: customer
        ? {
            name: customer.name,
            phone: customer.phone,
            lifetimeValue: customer.lifetimeValue,
            totalOrders: customer.totalOrders,
            createdAt: customer.createdAt,
          }
        : null,
      returns: returns.map((r) => ({
        orderNumber: r.orderNumber,
        items: r.items,
        status: r.status,
        createdAt: r.createdAt,
      })),
      newsletter: subscriber
        ? { active: subscriber.active, createdAt: subscriber.createdAt }
        : null,
      exportedAt: Date.now(),
    };
  },
});

/**
 * GDPR Data Deletion: Anonymize user's personal data.
 * Soft-deletes by anonymizing PII while preserving order history for business records.
 */
export const deleteMyData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const email = user.email.toLowerCase();
    const anonymizedEmail = `deleted-${user._id}@anonymized.local`;
    const now = Date.now();

    // Anonymize user record
    await ctx.db.patch(user._id, {
      email: anonymizedEmail,
      name: "Deleted User",
      avatar: undefined,
      status: "suspended",
      updatedAt: now,
    });

    // Anonymize customer record
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (customer) {
      await ctx.db.patch(customer._id, {
        email: anonymizedEmail,
        name: "Deleted User",
        phone: undefined,
        notes: undefined,
        updatedAt: now,
      });
    }

    // Anonymize orders (keep for business records but remove PII)
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customerEmail", (q) => q.eq("customerEmail", email))
      .collect();
    for (const order of orders) {
      await ctx.db.patch(order._id, {
        customerEmail: anonymizedEmail,
        customerName: "Deleted User",
        ipAddress: undefined,
        userAgent: undefined,
        notes: undefined,
        updatedAt: now,
      });
    }

    // Delete cart
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId ?? ""))
      .first();
    if (cart) {
      await ctx.db.delete(cart._id);
    }

    // Delete returns
    const returns = await ctx.db
      .query("returns")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId ?? ""))
      .collect();
    for (const ret of returns) {
      await ctx.db.delete(ret._id);
    }

    // Unsubscribe from newsletter
    const subscriber = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (subscriber) {
      await ctx.db.patch(subscriber._id, { active: false });
    }

    // Log the deletion
    await auditLog(ctx, {
      action: "user.gdpr_deletion",
      entityType: "user",
      entityId: user._id,
      summary: `User requested GDPR data deletion`,
    });

    return { success: true, message: "Your personal data has been anonymized." };
  },
});
