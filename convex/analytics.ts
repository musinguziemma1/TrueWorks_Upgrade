import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";
import { checkRateLimit } from "./rateLimit";

export const get = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return null;
    const results = await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    return results[0] ?? null;
  },
});

export const getRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    return await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) =>
        q.gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();
  },
});

/** Internal: tally a completed order's revenue + order count for its day. */
export const recordRevenue = internalMutation({
  args: { timestamp: v.number(), revenue: v.number() },
  handler: async (ctx, args) => {
    const date = new Date(args.timestamp).toISOString().slice(0, 10);
    const rowId = await ensureDayRow(ctx, date);
    const existing = await ctx.db.get(rowId);
    if (existing && "revenue" in existing && "orders" in existing) {
      await ctx.db.patch(rowId, {
        revenue: (existing.revenue ?? 0) + args.revenue,
        orders: (existing.orders ?? 0) + 1,
      });
    }
  },
});

/** Internal: tally a new download grant into its day. */
export const recordDownload = internalMutation({
  args: { at: v.number() },
  handler: async (ctx, args) => {
    const date = new Date(args.at).toISOString().slice(0, 10);
    const rowId = await ensureDayRow(ctx, date);
    const existing = await ctx.db.get(rowId);
    if (existing && "downloads" in existing) {
      await ctx.db.patch(rowId, { downloads: (existing.downloads ?? 0) + 1 });
    }
  },
});

async function ensureDayRow(ctx: any, date: string) {
  const existing = await ctx.db
    .query("analytics")
    .withIndex("by_date", (q: any) => q.eq("date", date))
    .first();
  if (existing) return existing._id;
  return await ctx.db.insert("analytics", {
    date,
    revenue: 0,
    orders: 0,
    downloads: 0,
    visitors: 0,
    pageViews: 0,
    createdAt: Date.now(),
  });
}

export const incrementVisitors = mutation({
  args: { date: v.string(), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.sessionId) {
      try {
        await checkRateLimit(ctx, `visitors:${args.date}`, args.sessionId, 5, 86_400_000);
      } catch {
        return;
      }
    }
    const rowId = await ensureDayRow(ctx, args.date);
    const existing = await ctx.db.get(rowId);
    if (existing && "visitors" in existing) {
      await ctx.db.patch(rowId, { visitors: (existing.visitors ?? 0) + 1 });
    }
  },
});

export const incrementPageViews = mutation({
  args: { date: v.string(), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.sessionId) {
      try {
        await checkRateLimit(ctx, "pageviews", args.sessionId, 120, 3_600_000);
      } catch {
        return;
      }
    }
    const rowId = await ensureDayRow(ctx, args.date);
    const existing = await ctx.db.get(rowId);
    if (existing && "pageViews" in existing) {
      await ctx.db.patch(rowId, { pageViews: (existing.pageViews ?? 0) + 1 });
    }
  },
});

export const summary = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { totalRevenue: 0, totalOrders: 0, totalDownloads: 0, totalVisitors: 0, totalPageViews: 0, dailyData: [] };

    // Revenue/orders/downloads are computed from the source-of-truth tables
    // rather than the analytics ledger (which previously stayed at zero because
    // nothing ever called its internal upsert).
    const startTs = args.startDate ? new Date(`${args.startDate}T00:00:00`).getTime() : 0;
    const endTs = args.endDate
      ? new Date(`${args.endDate}T23:59:59.999`).getTime()
      : Date.now();

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => (startTs ? q.gte("createdAt", startTs) : q).lte("createdAt", endTs))
      .collect();
    const downloads = await ctx.db
      .query("downloads")
      .withIndex("by_createdAt", (q) => (startTs ? q.gte("createdAt", startTs) : q).lte("createdAt", endTs))
      .collect();

    const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);

    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();
    for (const o of orders) {
      if (o.orderStatus === "cancelled") continue;
      const completed = o.paymentStatus === "completed";
      const key = dayKey(o.createdAt);
      ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
      if (completed) {
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + (o.total ?? 0));
      }
    }
    const downloadsByDay = new Map<string, number>();
    for (const d of downloads) {
      const key = dayKey(d.createdAt);
      downloadsByDay.set(key, (downloadsByDay.get(key) ?? 0) + 1);
    }

    // Merge with the analytics ledger (which tracks visitors + page views).
    let ledger = await ctx.db.query("analytics").collect();
    if (args.startDate) ledger = ledger.filter((a) => a.date >= args.startDate!);
    if (args.endDate) ledger = ledger.filter((a) => a.date <= args.endDate!);

    const allDays = new Set([...Array.from(ordersByDay.keys()), ...Array.from(downloadsByDay.keys()), ...ledger.map((a) => a.date)]);
    const dailyData = Array.from(allDays)
      .sort()
      .map((date) => {
        const ledgerRow = ledger.find((a) => a.date === date);
        return {
          date,
          revenue: revenueByDay.get(date) ?? 0,
          orders: ordersByDay.get(date) ?? 0,
          downloads: downloadsByDay.get(date) ?? 0,
          visitors: ledgerRow?.visitors ?? 0,
          pageViews: ledgerRow?.pageViews ?? 0,
        };
      });

    return {
      totalRevenue: Array.from(revenueByDay.values()).reduce((s, v) => s + v, 0),
      totalOrders: Array.from(ordersByDay.values()).reduce((s, v) => s + v, 0),
      totalDownloads: Array.from(downloadsByDay.values()).reduce((s, v) => s + v, 0),
      totalVisitors: ledger.reduce((s, a) => s + a.visitors, 0),
      totalPageViews: ledger.reduce((s, a) => s + a.pageViews, 0),
      dailyData,
    };
  },
});
