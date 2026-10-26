import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAdminSilent } from "./users";
import { checkRateLimit } from "./rateLimit";

/**
 * Ledger rows read per summary (one row per day, so this is a generous ceiling
 * that still stops a pathological range from scanning without bound).
 */
const MAX_LEDGER_ROWS = 10000;

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

async function ensureDayRow(ctx: MutationCtx, date: string) {
  const existing = await ctx.db
    .query("analytics")
    .withIndex("by_date", (q) => q.eq("date", date))
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
  returns: v.object({
    totalRevenue: v.number(),
    totalOrders: v.number(),
    totalDownloads: v.number(),
    totalVisitors: v.number(),
    totalPageViews: v.number(),
    dailyData: v.array(v.object({
      date: v.string(),
      revenue: v.number(),
      orders: v.number(),
      downloads: v.number(),
      visitors: v.number(),
      pageViews: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { totalRevenue: 0, totalOrders: 0, totalDownloads: 0, totalVisitors: 0, totalPageViews: 0, dailyData: [] };

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

    const dayKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);
    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();
    for (const order of orders) {
      if (order.orderStatus === "cancelled") continue;
      const date = dayKey(order.createdAt);
      ordersByDay.set(date, (ordersByDay.get(date) ?? 0) + 1);
      if (order.paymentStatus === "completed") {
        revenueByDay.set(date, (revenueByDay.get(date) ?? 0) + (order.total ?? 0));
      }
    }
    const downloadsByDay = new Map<string, number>();
    for (const download of downloads) {
      const date = dayKey(download.createdAt);
      downloadsByDay.set(date, (downloadsByDay.get(date) ?? 0) + 1);
    }

    const ledger = await ctx.db
      .query("analytics")
      .withIndex("by_date", (range) =>
        range
          .gte("date", args.startDate ?? "")
          .lte("date", args.endDate ?? "9999-99-99")
      )
      .take(MAX_LEDGER_ROWS);

    const allDays = new Set([
      ...ordersByDay.keys(),
      ...downloadsByDay.keys(),
      ...ledger.map((row) => row.date),
    ]);
    const ledgerByDate = new Map(ledger.map((row) => [row.date, row]));
    const dailyData = Array.from(allDays).sort().map((date) => {
      const row = ledgerByDate.get(date);
      return {
        date,
        revenue: revenueByDay.get(date) ?? 0,
        orders: ordersByDay.get(date) ?? 0,
        downloads: downloadsByDay.get(date) ?? 0,
        visitors: row?.visitors ?? 0,
        pageViews: row?.pageViews ?? 0,
      };
    });

    return {
      totalRevenue: Array.from(revenueByDay.values()).reduce((sum, value) => sum + value, 0),
      totalOrders: Array.from(ordersByDay.values()).reduce((sum, value) => sum + value, 0),
      totalDownloads: Array.from(downloadsByDay.values()).reduce((sum, value) => sum + value, 0),
      totalVisitors: ledger.reduce((s, a) => s + a.visitors, 0),
      totalPageViews: ledger.reduce((s, a) => s + a.pageViews, 0),
      dailyData,
    };
  },
});

const ltvSegmentValidator = v.object({ label: v.string(), count: v.number() });
const geoRegionValidator = v.object({ name: v.string(), count: v.number() });
const analyticsSummaryValidator = v.object({
  totalRevenue: v.number(),
  totalOrders: v.number(),
  totalDownloads: v.number(),
  totalVisitors: v.number(),
  totalPageViews: v.number(),
  dailyData: v.array(v.object({
    date: v.string(),
    revenue: v.number(),
    orders: v.number(),
    downloads: v.number(),
    visitors: v.number(),
    pageViews: v.number(),
  })),
});

/** Read and aggregate the analytics dashboard's datasets together on demand. */
export const dashboardData = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    startTimestamp: v.optional(v.number()),
    endTimestamp: v.optional(v.number()),
    previousStartDate: v.optional(v.string()),
    previousEndDate: v.optional(v.string()),
  },
  returns: v.object({
    summary: analyticsSummaryValidator,
    previousSummary: v.union(analyticsSummaryValidator, v.null()),
    breakdown: v.object({
      refundedOrders: v.number(),
      productPerformance: v.array(v.object({
        productId: v.id("products"),
        totalSales: v.number(),
        totalRevenue: v.number(),
      })),
      paymentMethods: v.array(v.object({ name: v.string(), value: v.number() })),
      geoData: v.array(v.object({
        country: v.string(),
        orders: v.number(),
        revenue: v.number(),
        regions: v.array(geoRegionValidator),
        cities: v.array(geoRegionValidator),
      })),
      ltvSegments: v.array(ltvSegmentValidator),
    }),
  }),
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) {
      return {
        summary: { totalRevenue: 0, totalOrders: 0, totalDownloads: 0, totalVisitors: 0, totalPageViews: 0, dailyData: [] },
        previousSummary: null,
        breakdown: { refundedOrders: 0, productPerformance: [], paymentMethods: [], geoData: [], ltvSegments: [] },
      };
    }

    const now = Date.now();
    const currentStart = args.startTimestamp ?? 0;
    const currentEnd = args.endTimestamp ?? now;
    const previousStart = args.previousStartDate
      ? new Date(`${args.previousStartDate}T00:00:00`).getTime()
      : null;
    const previousEnd = args.previousEndDate
      ? new Date(`${args.previousEndDate}T23:59:59.999`).getTime()
      : null;
    const rangeStart = previousStart === null ? currentStart : Math.min(currentStart, previousStart);
    const rangeEnd = previousEnd === null ? currentEnd : Math.max(currentEnd, previousEnd);
    const dayKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);
    const rangeStartDay = dayKey(rangeStart);
    const rangeEndDay = dayKey(rangeEnd);

    const [orders, downloads, ledger, customers] = await Promise.all([
      ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", rangeStart).lte("createdAt", rangeEnd))
        .collect(),
      ctx.db
        .query("downloads")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", rangeStart).lte("createdAt", rangeEnd))
        .collect(),
      ctx.db
        .query("analytics")
        .withIndex("by_date", (q) => q.gte("date", rangeStartDay).lte("date", rangeEndDay))
        .take(MAX_LEDGER_ROWS),
      ctx.db.query("customers").collect(),
    ]);

    const summarizeRange = (start: number, end: number) => {
      const startDay = dayKey(start);
      const endDay = dayKey(end);
      const ordersByDay = new Map<string, number>();
      const revenueByDay = new Map<string, number>();
      for (const order of orders) {
        if (order.createdAt < start || order.createdAt > end || order.orderStatus === "cancelled") continue;
        const date = dayKey(order.createdAt);
        ordersByDay.set(date, (ordersByDay.get(date) ?? 0) + 1);
        if (order.paymentStatus === "completed") {
          revenueByDay.set(date, (revenueByDay.get(date) ?? 0) + order.total);
        }
      }

      const downloadsByDay = new Map<string, number>();
      for (const download of downloads) {
        if (download.createdAt < start || download.createdAt > end) continue;
        const date = dayKey(download.createdAt);
        downloadsByDay.set(date, (downloadsByDay.get(date) ?? 0) + 1);
      }

      const dateRows = ledger.filter((row) => row.date >= startDay && row.date <= endDay);
      const ledgerByDate = new Map(dateRows.map((row) => [row.date, row]));
      const days = new Set([
        ...ordersByDay.keys(),
        ...downloadsByDay.keys(),
        ...dateRows.map((row) => row.date),
      ]);
      const dailyData = Array.from(days).sort().map((date) => {
        const row = ledgerByDate.get(date);
        return {
          date,
          revenue: revenueByDay.get(date) ?? 0,
          orders: ordersByDay.get(date) ?? 0,
          downloads: downloadsByDay.get(date) ?? 0,
          visitors: row?.visitors ?? 0,
          pageViews: row?.pageViews ?? 0,
        };
      });

      return {
        totalRevenue: Array.from(revenueByDay.values()).reduce((sum, value) => sum + value, 0),
        totalOrders: Array.from(ordersByDay.values()).reduce((sum, value) => sum + value, 0),
        totalDownloads: Array.from(downloadsByDay.values()).reduce((sum, value) => sum + value, 0),
        totalVisitors: dateRows.reduce((sum, row) => sum + row.visitors, 0),
        totalPageViews: dateRows.reduce((sum, row) => sum + row.pageViews, 0),
        dailyData,
      };
    };

    const currentOrders = orders.filter(
      (order) => order.createdAt >= currentStart && order.createdAt <= currentEnd,
    );
    const products = new Map<Id<"products">, { totalSales: number; totalRevenue: number }>();
    const paymentMethods = new Map<string, number>();
    let refundedOrders = 0;
    const countries = new Map<string, {
      orders: number;
      revenue: number;
      regions: Map<string, number>;
      cities: Map<string, number>;
    }>();

    for (const order of currentOrders) {
      const paymentMethod = order.paymentMethod || "Unknown";
      paymentMethods.set(paymentMethod, (paymentMethods.get(paymentMethod) ?? 0) + 1);
      if (order.paymentStatus === "refunded") refundedOrders += 1;

      const country = order.country || "Unknown";
      const countryStats = countries.get(country) ?? {
        orders: 0,
        revenue: 0,
        regions: new Map<string, number>(),
        cities: new Map<string, number>(),
      };
      countryStats.orders += 1;
      if (order.paymentStatus === "completed") countryStats.revenue += order.total;
      if (order.region) countryStats.regions.set(order.region, (countryStats.regions.get(order.region) ?? 0) + 1);
      if (order.city) countryStats.cities.set(order.city, (countryStats.cities.get(order.city) ?? 0) + 1);
      countries.set(country, countryStats);

      if (order.paymentStatus === "completed") {
        for (const item of order.items) {
          const stats = products.get(item.productId) ?? { totalSales: 0, totalRevenue: 0 };
          stats.totalSales += item.quantity;
          stats.totalRevenue += item.price * item.quantity;
          products.set(item.productId, stats);
        }
      }
    }

    const brackets = [
      { label: "0", min: 0, max: 0, count: 0 },
      { label: "< 50K", min: 1, max: 49_999, count: 0 },
      { label: "50K–250K", min: 50_000, max: 250_000, count: 0 },
      { label: "250K–1M", min: 250_001, max: 1_000_000, count: 0 },
      { label: "> 1M", min: 1_000_001, max: Number.MAX_SAFE_INTEGER, count: 0 },
    ];
    for (const customer of customers) {
      const bracket = brackets.find(
        (item) => customer.lifetimeValue >= item.min && customer.lifetimeValue <= item.max,
      );
      if (bracket) bracket.count += 1;
    }

    const countMap = (counts: Map<string, number>) =>
      Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return {
      summary: summarizeRange(currentStart, currentEnd),
      previousSummary: previousStart !== null && previousEnd !== null
        ? summarizeRange(previousStart, previousEnd)
        : null,
      breakdown: {
        refundedOrders,
        productPerformance: Array.from(products, ([productId, stats]) => ({
          productId,
          ...stats,
        })).sort((a, b) => b.totalSales - a.totalSales).slice(0, 10),
        paymentMethods: Array.from(paymentMethods, ([name, value]) => ({ name, value })),
        geoData: Array.from(countries, ([country, stats]) => ({
          country,
          orders: stats.orders,
          revenue: stats.revenue,
          regions: countMap(stats.regions),
          cities: countMap(stats.cities),
        })).sort((a, b) => b.orders - a.orders),
        ltvSegments: brackets.map(({ label, count }) => ({ label, count })),
      },
    };
  },
});
