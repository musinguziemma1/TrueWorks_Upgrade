import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSilent } from "./users";
import { sanitizeSearch } from "./lib/sanitize";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Infer the gateway provider from an order's stored payment id / method. */
function inferProvider(opts: { paymentId?: string; paymentMethod?: string }): string {
  const pid = opts.paymentId ?? "";
  if (pid.startsWith("pi_") || pid.startsWith("pay_") || pid.startsWith("sub_")) return "stripe";
  if (pid) return "pesapal";
  const method = (opts.paymentMethod ?? "").toLowerCase();
  if (method.includes("momo") || method.includes("pesa")) return "pesapal";
  return "manual";
}

/** Resolve a start cutoff from an explicit timestamp or a trailing-days window. */
function resolveStartDate(startDate?: number, days?: number): number | undefined {
  if (days && days > 0) return Date.now() - days * DAY_MS;
  return startDate;
}

/**
 * List payments with filtering, search, and server-side pagination.
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    provider: v.optional(v.string()),
    method: v.optional(v.string()),
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { payments: [], total: 0 };

    const q = args.status
      ? ctx.db.query("payments").withIndex("by_status", (q) =>
          q.eq("status", args.status as PaymentStatus)
        )
      : ctx.db.query("payments").withIndex("by_createdAt", (q) => q);

    let all = await q.collect();

    const startDate = resolveStartDate(args.startDate, args.days);
    if (startDate) all = all.filter((p) => p.createdAt >= startDate);
    if (args.endDate) all = all.filter((p) => p.createdAt <= args.endDate!);
    if (args.provider) all = all.filter((p) => p.provider === args.provider);
    if (args.method) all = all.filter((p) => p.method === args.method);

    if (args.search) {
      const lower = sanitizeSearch(args.search).toLowerCase();
      all = all.filter(
        (p) =>
          p.paymentId.toLowerCase().includes(lower) ||
          p.customerName.toLowerCase().includes(lower) ||
          p.customerEmail.toLowerCase().includes(lower) ||
          p.orderId.toLowerCase().includes(lower)
      );
    }

    all.sort((a, b) => b.createdAt - a.createdAt);

    const total = all.length;
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    const payments = all.slice(offset, offset + limit);

    return { payments, total };
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

/**
 * Upsert a payment row by gateway payment id so callbacks/webhooks always have
 * a record to update even if the row creation at checkout was skipped.
 */
export const upsertFromOrder = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
    provider: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    amount: v.number(),
    currency: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", args.paymentId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        method: args.method ?? existing.method,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    const now = Date.now();
    return await ctx.db.insert("payments", {
      orderId: args.orderId,
      paymentId: args.paymentId,
      provider: args.provider,
      method: args.method ?? "card",
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      customerEmail: args.customerEmail,
      customerName: args.customerName,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Admin-only: make the payments table mirror the orders table (the source of
 * truth). Creates missing rows for settled/failed orders, syncs stale statuses,
 * and reports orphaned payment rows. Re-runnable whenever drift appears.
 */
export const reconcileFromOrders = mutation({
  args: {
    removeOrphans: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) throw new Error("Unauthorized");

    const orders = await ctx.db.query("orders").collect();
    const payments = await ctx.db.query("payments").collect();

    const byOrder = new Map<string, (typeof payments)[number]>();
    for (const p of payments) {
      const key = p.orderId as string;
      const existing = byOrder.get(key);
      if (!existing || existing.status === "pending") byOrder.set(key, p);
    }

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let pendingSkipped = 0;

    const now = Date.now();
    for (const o of orders) {
      if (o.paymentStatus === "pending") {
        pendingSkipped++;
        continue;
      }
      const canonical = byOrder.get(o._id as string);
      if (!canonical) {
        const paymentId = o.paymentId ?? o.orderNumber;
        await ctx.db.insert("payments", {
          orderId: o._id,
          paymentId,
          provider: inferProvider({ paymentId, paymentMethod: o.paymentMethod }),
          method: o.paymentMethod || "card",
          amount: o.total,
          currency: "USD",
          status: o.paymentStatus,
          customerEmail: o.customerEmail,
          customerName: o.customerName,
          metadata: { reconciled: true },
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        });
        created++;
        continue;
      }
      const patch: Record<string, unknown> = {};
      if (canonical.status !== o.paymentStatus) patch.status = o.paymentStatus;
      if (!canonical.paymentId && o.paymentId) patch.paymentId = o.paymentId;
      if (!canonical.method) patch.method = o.paymentMethod || "card";
      if (!canonical.customerEmail) patch.customerEmail = o.customerEmail;
      if (!canonical.customerName) patch.customerName = o.customerName;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(canonical._id, { ...patch, updatedAt: now });
        updated++;
      } else {
        unchanged++;
      }
    }

    const orderIds = new Set(orders.map((o) => o._id));
    let orphaned = 0;
    let removedOrphans = 0;
    for (const p of payments) {
      if (!orderIds.has(p.orderId)) {
        orphaned++;
        if (args.removeOrphans) {
          await ctx.db.delete(p._id);
          removedOrphans++;
        }
      }
    }

    return {
      ordersScanned: orders.length,
      created,
      updated,
      unchanged,
      pendingSkipped,
      orphaned,
      removedOrphans,
    };
  },
});

export const stats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) {
      return {
        total: 0, completed: 0, pending: 0, failed: 0, refunded: 0,
        totalAmount: 0, successRate: 0, refundRate: 0, avgOrderValue: 0,
        primaryCurrency: "USD", revenueByCurrency: {}, byProvider: {},
        byMethod: {}, byStatus: {}, trend: [], recentActivity: [],
      };
    }

    let q = ctx.db.query("payments").withIndex("by_createdAt", (q) => q);

    const startDate = resolveStartDate(args.startDate, args.days);
    if (startDate) q = q.filter((q) => q.gte(q.field("createdAt"), startDate));
    if (args.endDate) q = q.filter((q) => q.lte(q.field("createdAt"), args.endDate!));

    const all = await q.collect();

    let completed = 0;
    let pending = 0;
    let failed = 0;
    let refunded = 0;
    const revenueByCurrency: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    // Daily buckets of completed revenue + volume, keyed by day-start timestamp.
    const dayMs = 24 * 60 * 60 * 1000;
    const trendMap = new Map<number, { revenue: number; count: number }>();

    for (const p of all) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      byProvider[p.provider] = (byProvider[p.provider] ?? 0) + 1;
      if (p.method) byMethod[p.method] = (byMethod[p.method] ?? 0) + 1;

      if (p.status === "completed") {
        completed++;
        const currency = (p.currency || "USD").toUpperCase();
        revenueByCurrency[currency] = (revenueByCurrency[currency] ?? 0) + p.amount;
        const dayStart = Math.floor(p.createdAt / dayMs) * dayMs;
        const bucket = trendMap.get(dayStart) ?? { revenue: 0, count: 0 };
        bucket.revenue += p.amount;
        bucket.count += 1;
        trendMap.set(dayStart, bucket);
      } else if (p.status === "pending") {
        pending++;
      } else if (p.status === "failed") {
        failed++;
      } else if (p.status === "refunded") {
        refunded++;
      }
    }

    // Primary currency = the one that generated the most completed revenue.
    const primaryCurrency =
      Object.entries(revenueByCurrency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
    const totalAmount = revenueByCurrency[primaryCurrency] ?? 0;

    const settled = completed + failed;
    const successRate = settled > 0 ? Math.round((completed / settled) * 1000) / 10 : 0;
    const refundRate = completed + refunded > 0
      ? Math.round((refunded / (completed + refunded)) * 1000) / 10
      : 0;

    const completedInPrimary = all.filter(
      (p) => p.status === "completed" && (p.currency || "USD").toUpperCase() === primaryCurrency
    );
    const avgOrderValue = completedInPrimary.length > 0
      ? Math.round(
          (completedInPrimary.reduce((s, p) => s + p.amount, 0) / completedInPrimary.length) * 100
        ) / 100
      : 0;

    const trend = [...trendMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, v]) => ({ timestamp, revenue: v.revenue, count: v.count }));

    const recentActivity = all
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);

    return {
      total: all.length,
      completed,
      pending,
      failed,
      refunded,
      totalAmount,
      successRate,
      refundRate,
      avgOrderValue,
      primaryCurrency,
      revenueByCurrency,
      byProvider,
      byMethod,
      byStatus,
      trend,
      recentActivity,
    };
  },
});

export const getById = query({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return null;
    return await ctx.db.get(args.id);
  },
});
