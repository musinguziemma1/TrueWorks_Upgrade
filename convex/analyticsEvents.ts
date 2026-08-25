import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAdminSilent } from "./users";

/**
 * Record a single conversion-funnel event. Events are fire-and-forget on the
 * client (best-effort); never forward PII you don't need.
 */
export const track = mutation({
  args: {
    event: v.string(),
    sessionId: v.optional(v.string()),
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
    category: v.optional(v.string()),
    value: v.optional(v.number()),
    path: v.optional(v.string()),
    referrer: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Only record events within a recognized set to avoid junk rows.
    const allowed = new Set([
      "view_product",
      "add_to_cart",
      "reach_checkout",
      "payment_start",
      "purchase",
    ]);
    if (!allowed.has(args.event)) return;

    const now = Date.now();
    await ctx.db.insert("analyticsEvents", {
      event: args.event as "view_product",
      sessionId: args.sessionId,
      productId: args.productId as Id<"products"> | undefined,
      productName: args.productName,
      category: args.category,
      value: args.value,
      path: args.path,
      referrer: args.referrer,
      email: args.email,
      createdAt: now,
    });
  },
});

export interface FunnelStep {
  name: string;
  count: number;
}

/**
 * Build a conversion funnel from discrete events within an optional window.
 * e.g. [view_product, add_to_cart, reach_checkout, payment_start, purchase].
 * Returns step counts + simple step-by-step conversion rates.
 */
export const funnel = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    productId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) {
      return { steps: [], rates: [] };
    }

    let events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_createdAt")
      .order("asc")
      .collect();

    if (args.startDate) {
      events = events.filter((e) => e.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.createdAt <= args.endDate!);
    }

    const stepOrder = [
      "view_product",
      "add_to_cart",
      "reach_checkout",
      "payment_start",
      "purchase",
    ];

    const counts = new Map<string, number>();
    for (const step of stepOrder) counts.set(step, 0);

    for (const e of events) {
      if (!counts.has(e.event)) continue;
      if (args.productId && e.productId !== args.productId) continue;
      counts.set(e.event, (counts.get(e.event) ?? 0) + 1);
    }

    const funnel: FunnelStep[] = stepOrder.map((name) => ({
      name,
      count: counts.get(name) ?? 0,
    }));

    const rates = stepOrder.slice(1).map((name, i) => {
      const prev = counts.get(stepOrder[i]) ?? 0;
      const curr = counts.get(name) ?? 0;
      return {
        from: stepOrder[i],
        to: name,
        rate: prev > 0 ? curr / prev : 0,
      };
    });

    return { funnel, rates };
  },
});

export const overview = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { total: 0, byEvent: [], topProducts: [] };
    let events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_createdAt")
      .order("asc")
      .collect();

    if (args.startDate) events = events.filter((e) => e.createdAt >= args.startDate!);
    if (args.endDate) events = events.filter((e) => e.createdAt <= args.endDate!);

    const byEvent = new Map<string, number>();
    const top = new Map<string, { name: string; count: number }>();
    for (const e of events) {
      byEvent.set(e.event, (byEvent.get(e.event) ?? 0) + 1);
      if (e.productId && e.productName) {
        const key = e.productId;
        const cur = top.get(key) ?? { name: e.productName, count: 0 };
        cur.count += 1;
        cur.name = e.productName;
        top.set(key, cur);
      }
    }

    return {
      total: events.length,
      byEvent: Object.fromEntries(byEvent),
      topProducts: Array.from(top.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  },
});