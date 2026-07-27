import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin, requireAdminSilent } from "./users";

export const list = query({
  args: {
    paymentStatus: v.optional(v.string()),
    orderStatus: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const q = args.paymentStatus
      ? ctx.db.query("orders").withIndex("by_paymentStatus", (q) =>
          q.eq("paymentStatus", args.paymentStatus as "pending" | "completed" | "failed" | "refunded")
        )
      : args.orderStatus
      ? ctx.db.query("orders").withIndex("by_orderStatus", (q) =>
          q.eq("orderStatus", args.orderStatus as "pending" | "processing" | "completed" | "cancelled")
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
    const me = await getCurrentUser(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    if (!me) return null;
    if (me.role === "admin" || me.role === "owner" || me.role === "editor") return order;
    if (order.customerEmail === me.email) return order;
    return null;
  },
});

const orderCreateArgs = {
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
  discountAmount: v.optional(v.number()),
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
  couponCode: v.optional(v.string()),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  notes: v.optional(v.string()),
};

async function insertOrder(ctx: MutationCtx, args: {
  orderNumber: string;
  customerId?: Id<"customers">;
  customerEmail: string;
  customerName: string;
  items: { productId: Id<"products">; productName: string; quantity: number; price: number }[];
  subtotal: number;
  tax: number;
  discountAmount?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  orderStatus: "pending" | "processing" | "completed" | "cancelled";
  downloadLinks: { productId: Id<"products">; url: string; expiresAt: number; downloadCount: number }[];
  couponCode?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}) {
  const now = Date.now();
  const orderId = await ctx.db.insert("orders", {
    ...args,
    createdAt: now,
    updatedAt: now,
  });

  for (const item of args.items) {
    const product = await ctx.db.get(item.productId);
    if (product) {
      await ctx.db.patch(item.productId, {
        totalSales: product.totalSales + item.quantity,
        updatedAt: now,
      });
    }
  }

  return orderId;
}

// Admin-only: manual order creation from the admin dashboard
export const create = mutation({
  args: orderCreateArgs,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await insertOrder(ctx, args);
  },
});

// Internal: called by checkout/payment HTTP actions (server-side computed totals)
export const createInternal = internalMutation({
  args: orderCreateArgs,
  handler: async (ctx, args) => {
    return await insertOrder(ctx, args);
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

export const updateFromPayment = internalMutation({
  args: {
    orderId: v.string(),
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded"))),
    orderStatus: v.optional(v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled"))),
    paymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", args.orderId))
      .collect();

    const order = orders[0];
    if (!order) return null;

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.paymentStatus) patch.paymentStatus = args.paymentStatus;
    if (args.orderStatus) patch.orderStatus = args.orderStatus;
    if (args.paymentId) patch.paymentId = args.paymentId;

    await ctx.db.patch(order._id, patch);
    return order._id;
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return { total: 0, totalRevenue: 0, pending: 0, completed: 0, refunded: 0, averageOrderValue: 0 };
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
