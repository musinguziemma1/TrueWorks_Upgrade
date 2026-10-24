import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSilent } from "./users";

/** Sort-maximum sentinels so every index range is explicitly bounded. */
const MAX_TIMESTAMP = 9007199254740991;

/**
 * Upper bound on how many analytics events a single read will scan. The window
 * is pushed into the `by_createdAt` index and capped so cost stays flat as the
 * table grows instead of scaling with every event ever recorded.
 */
const MAX_EVENTS_SCAN = 5000;

const eventValidator = v.union(
  v.literal("view_product"),
  v.literal("add_to_cart"),
  v.literal("reach_checkout"),
  v.literal("payment_start")
);

const MAX_EVENT_ID_LENGTH = 128;
const MAX_SESSION_ID_LENGTH = 128;
const MAX_PRODUCT_NAME_LENGTH = 256;
const MAX_CATEGORY_LENGTH = 128;
const MAX_PATH_LENGTH = 2048;

function assertBounded(value: string | undefined, max: number, name: string) {
  if (value !== undefined && (value.length === 0 || value.length > max)) {
    throw new Error(`${name} is invalid`);
  }
}

/**
 * Record a single conversion-funnel event. Events are fire-and-forget on the
 * client (best-effort); never forward PII you don't need.
 */
export const track = mutation({
  args: {
    eventId: v.string(),
    event: eventValidator,
    sessionId: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    productName: v.optional(v.string()),
    category: v.optional(v.string()),
    value: v.optional(v.number()),
    path: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  returns: v.object({ accepted: v.boolean(), duplicate: v.boolean() }),
  handler: async (ctx, args) => {
    assertBounded(args.eventId, MAX_EVENT_ID_LENGTH, "eventId");
    assertBounded(args.sessionId, MAX_SESSION_ID_LENGTH, "sessionId");
    assertBounded(args.productName, MAX_PRODUCT_NAME_LENGTH, "productName");
    assertBounded(args.category, MAX_CATEGORY_LENGTH, "category");
    assertBounded(args.path, MAX_PATH_LENGTH, "path");
    assertBounded(args.referrer, MAX_PATH_LENGTH, "referrer");
    if (args.value !== undefined && !Number.isFinite(args.value)) {
      throw new Error("value is invalid");
    }

    // A client may replay a request after a timeout. The event ID makes that
    // replay idempotent instead of creating another analytics row.
    const existing = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (existing) return { accepted: true, duplicate: true };

    const now = Date.now();
    await ctx.db.insert("analyticsEvents", {
      event: args.event,
      eventId: args.eventId,
      sessionId: args.sessionId,
      productId: args.productId,
      productName: args.productName,
      category: args.category,
      value: args.value,
      path: args.path,
      referrer: args.referrer,
      createdAt: now,
    });
    return { accepted: true, duplicate: false };
  },
});

/**
 * Record a settled purchase from a verified payment callback.
 * The browser is deliberately not allowed to create purchase events.
 */
export const recordPurchase = internalMutation({
  args: {
    orderId: v.id("orders"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        value: v.number(),
      })
    ),
  },
  returns: v.object({ accepted: v.boolean(), duplicate: v.boolean() }),
  handler: async (ctx, args) => {
    const items = args.items.length > 0
      ? args.items
      : [{ productId: undefined, productName: undefined, value: 0 }];
    let existingCount = 0;

    for (const item of items) {
      const eventId = item.productId
        ? `purchase:${args.orderId}:${item.productId}`
        : `purchase:${args.orderId}`;
      const existing = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
        .first();
      if (existing) {
        existingCount += 1;
        continue;
      }

      await ctx.db.insert("analyticsEvents", {
        event: "purchase",
        eventId,
        orderId: args.orderId,
        productId: item.productId,
        productName: item.productName,
        value: item.value,
        createdAt: Date.now(),
      });
    }

    return { accepted: true, duplicate: existingCount === items.length };
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
    productId: v.optional(v.id("products")),
  },
  returns: v.object({
    funnel: v.array(v.object({ name: v.string(), count: v.number() })),
    rates: v.array(v.object({ from: v.string(), to: v.string(), rate: v.number() })),
  }),
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) {
      return { funnel: [], rates: [] };
    }

    // Push the date window into the index — a post-scan `.filter()` would still
    // read the whole table — and cap the scan at the most recent events.
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_createdAt", (range) =>
        range
          .gte("createdAt", args.startDate ?? 0)
          .lte("createdAt", args.endDate ?? MAX_TIMESTAMP)
      )
      .order("desc")
      .take(MAX_EVENTS_SCAN);

    const stepOrder = [
      "view_product",
      "add_to_cart",
      "reach_checkout",
      "payment_start",
      "purchase",
    ];

    const counts = new Map<string, number>();
    const uniqueKeys = new Map<string, Set<string>>();
    for (const step of stepOrder) counts.set(step, 0);
    for (const step of stepOrder) uniqueKeys.set(step, new Set());

    for (const e of events) {
      if (!counts.has(e.event)) continue;
      if (args.productId && e.productId !== args.productId) continue;
      const key =
        e.event === "purchase"
          ? e.orderId ?? e.sessionId ?? e.eventId ?? e._id
          : e.sessionId ?? e.eventId ?? e._id;
      uniqueKeys.get(e.event)?.add(key);
    }
    for (const step of stepOrder) counts.set(step, uniqueKeys.get(step)?.size ?? 0);

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
  returns: v.object({
    total: v.number(),
    byEvent: v.record(v.string(), v.number()),
    topProducts: v.array(v.object({ name: v.string(), count: v.number() })),
  }),
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { total: 0, byEvent: {}, topProducts: [] };

    // Index-range + capped scan (see MAX_EVENTS_SCAN); newest events first.
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_createdAt", (range) =>
        range
          .gte("createdAt", args.startDate ?? 0)
          .lte("createdAt", args.endDate ?? MAX_TIMESTAMP)
      )
      .order("desc")
      .take(MAX_EVENTS_SCAN);

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
