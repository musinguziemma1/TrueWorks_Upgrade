import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

export const list = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const q = args.status
      ? ctx.db.query("payments").withIndex("by_status", (q) =>
          q.eq("status", args.status as "pending" | "completed" | "failed" | "refunded")
        )
      : ctx.db.query("payments").withIndex("by_createdAt", (q) => q);

    if (args.search) {
      const lower = args.search.toLowerCase();
      const all = await q.collect();
      return all.filter((p) =>
        p.paymentId.toLowerCase().includes(lower) ||
        p.customerName.toLowerCase().includes(lower) ||
        p.customerEmail.toLowerCase().includes(lower)
      );
    }

    return await q.order("desc").take(100);
  },
});

export const getByOrderId = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    return await ctx.db
      .query("payments")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
  },
});

export const getByOrderIdInternal = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
  },
});

export const getByPaymentId = internalQuery({
  args: { paymentId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("payments")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", args.paymentId))
      .collect();
    return results[0] ?? null;
  },
});

export const create = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
    provider: v.string(),
    method: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    customerEmail: v.string(),
    customerName: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("payments", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = internalMutation({
  args: {
    id: v.id("payments"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return { totalAmount: 0, count: 0, completed: 0, pending: 0, failed: 0 };
    const all = await ctx.db.query("payments").collect();
    const totalAmount = all
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      total: all.length,
      completed: all.filter((p) => p.status === "completed").length,
      pending: all.filter((p) => p.status === "pending").length,
      failed: all.filter((p) => p.status === "failed").length,
      refunded: all.filter((p) => p.status === "refunded").length,
      totalAmount,
    };
  },
});
