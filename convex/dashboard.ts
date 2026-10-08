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
        customerCount: 0,
        recentOrders: [],
        dailyRevenue: [],
        totalDownloads: 0,
        activeLicenses: 0,
      };
    }

    const now = Date.now();
    const recentWindowStart = now - 45 * DAY_MS;

    const [allOrders, recentOrders, productCounts, subscriberCount, customerCount, downloadsCount, activeLicenses] = await Promise.all([
      Promise.all([
        ctx.db.query("orders").withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", "completed")).collect(),
        ctx.db.query("orders").withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", "pending")).collect(),
        ctx.db.query("orders").withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", "failed")).collect(),
        ctx.db.query("orders").withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", "refunded")).collect(),
      ]).then(([completed, pending, failed, refunded]) => ({
        completed,
        pending,
        failed,
        refunded,
      })),
      ctx.db.query("orders")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", recentWindowStart))
        .order("desc")
        .take(5),
      Promise.all([
        ctx.db.query("products").withIndex("by_status", (q) => q.eq("status", "published")).collect(),
        ctx.db.query("products").withIndex("by_status", (q) => q.eq("status", "draft")).collect(),
        ctx.db.query("products").withIndex("by_status", (q) => q.eq("status", "archived")).collect(),
      ]).then(([published, draft, archived]) => ({
        published,
        draft,
        archived,
      })),
      ctx.db.query("subscribers").collect().then((rows) => rows.length),
      ctx.db.query("customers").collect().then((rows) => rows.length),
      ctx.db.query("downloads").collect().then((rows) => rows.length),
      ctx.db.query("licenses").withIndex("by_status", (q) => q.eq("status", "active")).collect().then((rows) => rows.length),
    ]);

    const completed = allOrders.completed.length;
    const pending = allOrders.pending.length;
    const refunded = allOrders.refunded.length;
    const failed = allOrders.failed.length;
    const total = completed + pending + refunded + failed;
    const totalRevenue = allOrders.completed.reduce((sum, order) => sum + order.total, 0);
    const revenueByDay = new Map<string, number>();

    for (const order of recentOrders) {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.total);
    }

    return {
      orderStats: { total, totalRevenue, pending, completed, refunded },
      productStats: {
        total: productCounts.published.length + productCounts.draft.length + productCounts.archived.length,
        published: productCounts.published.length,
        draft: productCounts.draft.length,
        archived: productCounts.archived.length,
      },
      subscriberCount,
      customerCount,
      recentOrders: recentOrders.slice(0, 5),
      dailyRevenue: Array.from(revenueByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue })),
      totalDownloads: downloadsCount,
      activeLicenses,
    };
  },
});