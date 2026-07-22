import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";

export const list = query({
  args: {
    paymentStatus: v.optional(v.string()),
    orderStatus: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const q = args.paymentStatus
      ? ctx.db.query("orders").withIndex("by_paymentStatus", (q) =>
          q.eq("paymentStatus", args.paymentStatus as "pending" | "completed" | "failed" | "refunded")
        )
      : ctx.db.query("orders").withIndex("by_createdAt", (q) => q);

    if (args.search) {
      const lower = args.search.toLowerCase();
      const all = await q.collect();
      return all.filter((o) =>
        o.orderNumber.toLowerCase().includes(lower) ||
        o.customerName.toLowerCase().includes(lower) ||
        o.customerEmail.toLowerCase().includes(lower)
      );
    }

    return await q.order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    orderNumber: v.string(),
    customerId: v.optional(v.id("customers")),
    customerEmail: v.string(),
    customerName: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    paymentMethod: v.string(),
    paymentStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    orderStatus: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled")),
    downloadLinks: v.array(v.object({
      productId: v.id("products"),
      url: v.string(),
      expiresAt: v.number(),
      downloadCount: v.number(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("orders", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded"))),
    orderStatus: v.optional(v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("orders").collect();
    const totalRevenue = all.reduce((sum, o) => sum + (o.paymentStatus === "completed" ? o.total : 0), 0);
    const pending = all.filter((o) => o.paymentStatus === "pending").length;
    const completed = all.filter((o) => o.paymentStatus === "completed").length;
    return {
      total: all.length,
      totalRevenue,
      pending,
      completed,
      refunded: all.filter((o) => o.paymentStatus === "refunded").length,
      failed: all.filter((o) => o.paymentStatus === "failed").length,
    };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];
    return await ctx.db
      .query("orders")
      .withIndex("by_customerEmail", (q) => q.eq("customerEmail", me.email))
      .order("desc")
      .take(50);
  },
});
