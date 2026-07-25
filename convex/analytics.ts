import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

export const get = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
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
    return await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) =>
        q.gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();
  },
});

export const upsert = mutation({
  args: {
    date: v.string(),
    revenue: v.number(),
    orders: v.number(),
    downloads: v.number(),
    visitors: v.number(),
    pageViews: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    const now = Date.now();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        revenue: args.revenue,
        orders: args.orders,
        downloads: args.downloads,
        visitors: args.visitors,
        pageViews: args.pageViews,
      });
      return existing[0]._id;
    }
    return await ctx.db.insert("analytics", {
      ...args,
      createdAt: now,
    });
  },
});

export const incrementVisitors = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        visitors: existing[0].visitors + 1,
      });
    } else {
      await ctx.db.insert("analytics", {
        date: args.date,
        revenue: 0,
        orders: 0,
        downloads: 0,
        visitors: 1,
        pageViews: 1,
        createdAt: Date.now(),
      });
    }
  },
});

export const incrementPageViews = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        pageViews: existing[0].pageViews + 1,
      });
    }
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return { totalRevenue: 0, totalOrders: 0, totalDownloads: 0, totalVisitors: 0, totalPageViews: 0, dailyData: [] };
    const all = await ctx.db.query("analytics").collect();
    const sorted = all.sort((a, b) => a.date.localeCompare(b.date));
    const totalRevenue = all.reduce((sum, a) => sum + a.revenue, 0);
    const totalOrders = all.reduce((sum, a) => sum + a.orders, 0);
    const totalDownloads = all.reduce((sum, a) => sum + a.downloads, 0);
    const totalVisitors = all.reduce((sum, a) => sum + a.visitors, 0);
    const totalPageViews = all.reduce((sum, a) => sum + a.pageViews, 0);
    return {
      totalRevenue,
      totalOrders,
      totalDownloads,
      totalVisitors,
      totalPageViews,
      dailyData: sorted,
    };
  },
});
