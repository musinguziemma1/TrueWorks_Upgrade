import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin, requireAdminSilent } from "./users";

export const list = query({
  args: {
    paymentStatus: v.optional(v.string()),
    orderStatus: v.optional(v.string()),
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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

    let results = await q.collect();
    if (args.startDate) results = results.filter((o) => o.createdAt >= args.startDate!);
    if (args.endDate) results = results.filter((o) => o.createdAt <= args.endDate!);

    if (args.search) {
      const lower = args.search.toLowerCase();
      results = results.filter((o) =>
        o.orderNumber.toLowerCase().includes(lower) ||
        o.customerName.toLowerCase().includes(lower) ||
        o.customerEmail.toLowerCase().includes(lower)
      );
    }

    return results.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
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

// Internal: called by orderEmails action — no auth check since this is only
// invoked from within Convex's own actions/mutations.
export const getByIdInternal = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
  country: v.optional(v.string()),
  region: v.optional(v.string()),
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
  country?: string;
  region?: string;
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
    const previous = await ctx.db.get(id);
    if (!previous) throw new Error("Order not found");

    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });

    // Notify the customer via email if status actually changed
    const statusChanged =
      (args.orderStatus && args.orderStatus !== previous.orderStatus) ||
      (args.paymentStatus && args.paymentStatus !== previous.paymentStatus);

    if (statusChanged) {
      await ctx.scheduler.runAfter(0, internal.orderEmails.sendOrderStatusEmail, {
        orderId: id,
        previousOrderStatus: previous.orderStatus,
        previousPaymentStatus: previous.paymentStatus,
      });
    }
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

/**
 * Aggregate order count by payment method (e.g. "MTN MoMo", "Card").
 * Used by the analytics page to show a real payment-method pie chart.
 */
export const paymentMethodBreakdown = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    let all = await ctx.db.query("orders").collect();
    if (args.startDate) all = all.filter((o) => o.createdAt >= args.startDate!);
    if (args.endDate) all = all.filter((o) => o.createdAt <= args.endDate!);
    const counts = new Map<string, number>();
    for (const o of all) {
      const key = o.paymentMethod || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  },
});

/**
 * Group customers into lifetime value brackets for cohort analysis.
 */
export const customerLtvSegments = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const all = await ctx.db.query("customers").collect();
    const brackets = [
      { label: "0", min: 0, max: 0, count: 0 },
      { label: "< 50K", min: 1, max: 50_000, count: 0 },
      { label: "50K–250K", min: 50_000, max: 250_000, count: 0 },
      { label: "250K–1M", min: 250_000, max: 1_000_000, count: 0 },
      { label: "> 1M", min: 1_000_000, max: Number.MAX_SAFE_INTEGER, count: 0 },
    ];
    for (const c of all) {
      const ltv = c.lifetimeValue;
      for (const b of brackets) {
        if (ltv >= b.min && ltv <= b.max) {
          b.count++;
          break;
        }
      }
    }
    return brackets.map(({ label, count }) => ({ label, count }));
  },
});

export const geoBreakdown = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    let all = await ctx.db.query("orders").collect();
    if (args.startDate) all = all.filter((o) => o.createdAt >= args.startDate!);
    if (args.endDate) all = all.filter((o) => o.createdAt <= args.endDate!);
    const countryData = new Map<string, { orders: number; revenue: number }>();
    for (const o of all) {
      const country = o.country || "Unknown";
      const existing = countryData.get(country) ?? { orders: 0, revenue: 0 };
      existing.orders++;
      if (o.paymentStatus === "completed") existing.revenue += o.total;
      countryData.set(country, existing);
    }
    return Array.from(countryData.entries())
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.orders - a.orders);
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
