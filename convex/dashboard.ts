import { query } from "./_generated/server";
import { requireAdminSilent } from "./users";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Single subscription backing the admin dashboard. Replaces the previous five
 * separate subscriptions (orders.stats, products.stats, orders.list,
 * subscribers.list, analytics.summary) so each table is scanned once and the
 * page survives on a single round trip instead of five.
 */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) {
      return {
        orderStats: { total: 0, totalRevenue: 0, pending: 0, completed: 0, refunded: 0 },
        productStats: { total: 0, published: 0, draft: 0, archived: 0 },
        subscriberCount: 0,
        recentOrders: [],
        dailyRevenue: [],
        totalDownloads: 0,
      };
    }

    const now = Date.now();
    const recentWindowStart = now - 45 * DAY_MS;

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", recentWindowStart))
      .order("desc")
      .collect();

    const products = await ctx.db.query("products").collect();
    const subscribers = await ctx.db.query("subscribers").collect();
    const downloads = await ctx.db.query("downloads").collect();

    // All-time order stats. Recent-window orders are used for the revenue trend
    // (the panel only ever shows the last handful of days).
    let total = 0;
    let totalRevenue = 0;
    let pending = 0;
    let completed = 0;
    let refunded = 0;
    const revenueByDay = new Map<string, number>();

    for (const o of orders) {
      total++;
      if (o.paymentStatus === "completed") {
        completed++;
        totalRevenue += o.total;
        if (o.createdAt >= recentWindowStart) {
          const key = new Date(o.createdAt).toISOString().slice(0, 10);
          revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + o.total);
        }
      } else if (o.paymentStatus === "pending") {
        pending++;
      } else if (o.paymentStatus === "refunded") {
        refunded++;
      }
    }

    let published = 0;
    let draft = 0;
    let archived = 0;
    for (const p of products) {
      if (p.status === "published") published++;
      else if (p.status === "draft") draft++;
      else if (p.status === "archived") archived++;
    }

    return {
      orderStats: { total, totalRevenue, pending, completed, refunded },
      productStats: { total: products.length, published, draft, archived },
      subscriberCount: subscribers.length,
      recentOrders: orders.slice(0, 5),
      dailyRevenue: Array.from(revenueByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue })),
      totalDownloads: downloads.length,
    };
  },
});