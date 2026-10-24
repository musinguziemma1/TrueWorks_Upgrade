import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAdminSilent } from "./users";
import { checkRateLimit } from "./rateLimit";

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
const FUNNEL_COUNTER_SHARDS = 16;

const STAGE_BY_EVENT = {
  view_product: 0,
  add_to_cart: 1,
  reach_checkout: 2,
  payment_start: 3,
  purchase: 4,
} as const;

type FunnelProgressInput = {
  sessionKey: string;
  sessionId?: string;
  orderId?: Id<"orders">;
  productId?: Id<"products">;
  stage: number;
  reachedAt: number;
  eventId: string;
  productName?: string;
};

function counterShard(sessionKey: string) {
  let hash = 0;
  for (let i = 0; i < sessionKey.length; i++) {
    hash = (hash * 31 + sessionKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % FUNNEL_COUNTER_SHARDS;
}

async function incrementFunnelCounter(
  ctx: MutationCtx,
  input: {
    date: string;
    stage: number;
    productId?: Id<"products">;
    productName?: string;
    shard: number;
  }
) {
  const key = `${input.date}:${input.stage}:${input.productId ?? "all"}:${input.shard}`;
  const existing = await ctx.db
    .query("analyticsFunnelCounters")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      ...(input.productName ? { productName: input.productName } : {}),
    });
  } else {
    await ctx.db.insert("analyticsFunnelCounters", { key, ...input, count: 1 });
  }
}

async function advanceFunnelProgress(ctx: MutationCtx, input: FunnelProgressInput) {
  const previous = await ctx.db
    .query("analyticsFunnelProgress")
    .withIndex("by_sessionKey_stage", (q) => q.eq("sessionKey", input.sessionKey))
    .order("desc")
    .first();

  // Only accept the next stage. This makes progression chronological and
  // prevents late/out-of-order events from manufacturing earlier stages.
  if (!previous && input.stage !== 0 && input.stage !== STAGE_BY_EVENT.purchase) return;
  if (previous && input.stage !== previous.stage + 1) return;

  await ctx.db.insert("analyticsFunnelProgress", {
    sessionKey: input.sessionKey,
    sessionId: input.sessionId,
    orderId: input.orderId,
    productId: input.productId,
    stage: input.stage,
    reachedAt: input.reachedAt,
    eventId: input.eventId,
  });
  const date = new Date(input.reachedAt).toISOString().slice(0, 10);
  const shard = counterShard(input.sessionKey);
  await incrementFunnelCounter(ctx, { date, stage: input.stage, shard });
  if (input.productId) {
    await incrementFunnelCounter(ctx, {
      date,
      stage: input.stage,
      productId: input.productId,
      productName: input.productName,
      shard,
    });
  }
}

async function readFunnelCounter(
  ctx: QueryCtx,
  stage: number,
  productId: Id<"products"> | undefined,
  startDate: number | undefined,
  endDate: number | undefined
) {
  const start = startDate === undefined ? "0000-01-01" : new Date(startDate).toISOString().slice(0, 10);
  const end = endDate === undefined ? "9999-12-31" : new Date(endDate).toISOString().slice(0, 10);
  const rows = productId
    ? ctx.db
        .query("analyticsFunnelCounters")
        .withIndex("by_stage_productId_date", (range) =>
          range.eq("stage", stage).eq("productId", productId).gte("date", start).lte("date", end)
        )
    : ctx.db
        .query("analyticsFunnelCounters")
        .withIndex("by_stage_date", (range) =>
          range.eq("stage", stage).gte("date", start).lte("date", end)
        );
  let total = 0;
  for await (const row of rows) total += row.count;
  return total;
}

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

    await checkRateLimit(ctx, "analytics.track", args.sessionId ?? args.eventId, 120, 60_000);

    const now = Date.now();
    const product = args.productId ? await ctx.db.get(args.productId) : null;
    await ctx.db.insert("analyticsEvents", {
      event: args.event,
      productType: product?.productType ?? (args.productId ? "template" : undefined),
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
    if (args.sessionId) {
      await advanceFunnelProgress(ctx, {
        sessionKey: `${args.sessionId}:${args.productId ?? ""}`,
        sessionId: args.sessionId,
        productId: args.productId,
        stage: STAGE_BY_EVENT[args.event],
        reachedAt: now,
        eventId: args.eventId,
        productName: args.productName,
      });
    }
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
    sessionId: v.optional(v.string()),
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
    const items = args.items.length > 0 ? args.items : [null];
    let existingCount = 0;

    for (const item of items) {
      const productId = item?.productId;
      const eventId = productId
        ? `purchase:${args.orderId}:${productId}`
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
        productType: productId
          ? ((await ctx.db.get(productId))?.productType ?? "template")
          : undefined,
        eventId,
        orderId: args.orderId,
        productId,
        productName: item?.productName,
        value: item?.value,
        createdAt: Date.now(),
      });
      await advanceFunnelProgress(ctx, {
        sessionKey: `${args.sessionId ?? `order:${args.orderId}`}:${productId ?? ""}`,
        sessionId: args.sessionId,
        orderId: args.orderId,
        productId,
        productName: item?.productName,
        stage: STAGE_BY_EVENT.purchase,
        reachedAt: Date.now(),
        eventId,
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
    const stepOrder = [
      "view_product",
      "add_to_cart",
      "reach_checkout",
      "payment_start",
      "purchase",
    ];

    const counts = await Promise.all(
      stepOrder.map((_, stage) =>
        readFunnelCounter(ctx, stage, args.productId, args.startDate, args.endDate)
      )
    );

    const funnel: FunnelStep[] = stepOrder.map((name, i) => ({
      name,
      count: counts[i] ?? 0,
    }));

    const rates = stepOrder.slice(1).map((name, i) => {
      const prev = counts[i] ?? 0;
      const curr = counts[i + 1] ?? 0;
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

    // Read maintained counters instead of scanning raw events. The date range
    // is applied inside each indexed query, so cost is bounded by days and
    // counter shards rather than event volume.
    const stepOrder = [
      "view_product",
      "add_to_cart",
      "reach_checkout",
      "payment_start",
      "purchase",
    ];
    const counts = await Promise.all(
      stepOrder.map((_, stage) =>
        readFunnelCounter(ctx, stage, undefined, args.startDate, args.endDate)
      )
    );
    const byEvent = Object.fromEntries(
      stepOrder.map((event, index) => [event, counts[index] ?? 0])
    );

    const start = args.startDate === undefined
      ? "0000-01-01"
      : new Date(args.startDate).toISOString().slice(0, 10);
    const end = args.endDate === undefined
      ? "9999-12-31"
      : new Date(args.endDate).toISOString().slice(0, 10);
    const top = new Map<string, { name: string; count: number }>();
    for (const stage of [0, 1, 2, 3, 4]) {
      const rows = ctx.db
        .query("analyticsFunnelCounters")
        .withIndex("by_stage_date_productId", (range) =>
          range.eq("stage", stage).gte("date", start).lte("date", end)
        );
      for await (const row of rows) {
        if (!row.productId) continue;
        const current = top.get(row.productId) ?? {
          name: row.productName ?? row.productId,
          count: 0,
        };
        current.count += row.count;
        if (row.productName) current.name = row.productName;
        top.set(row.productId, current);
      }
    }

    return {
      total: counts.reduce((total, count) => total + count, 0),
      byEvent,
      topProducts: Array.from(top.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  },
});
