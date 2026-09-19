import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { isGuestEmail } from "./abandonedCarts";

/**
 * Retention for the append-only tables.
 *
 * `analyticsEvents`, `auditLogs`, `webhookDeliveries` and `abandonedCarts` only
 * ever grow. Left alone they inflate storage and make every read against them
 * more expensive. Each pruner below deletes a bounded number of the oldest rows
 * and reschedules itself *only while it still has a full batch of work*, so no
 * single transaction grows unbounded and no cleanup loop can spin forever.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long each table keeps rows. */
export const RETENTION_MS = {
  /** Raw funnel/overview events — only recent windows are ever charted. */
  analyticsEvents: 90 * DAY_MS,
  /** Security trail — kept longer for investigations. */
  auditLogs: 180 * DAY_MS,
  /** Webhook delivery logs — operational only. */
  webhookDeliveries: 30 * DAY_MS,
  /** Carts this old can no longer be recovered, so they are dead weight. */
  abandonedCarts: 180 * DAY_MS,
  /** Guest carts use a dead `*.local` address — pure analytics noise. */
  guestCarts: 7 * DAY_MS,
} as const;

/** Rows deleted per transaction. */
const BATCH = 500;
/** Batches drained before handing the rest of the work to a fresh transaction. */
const BATCHES_PER_CALL = 4;

/**
 * Daily retention entry point (registered in `crons.ts`). It only *schedules*
 * the pruners so each batch of deletes runs in its own transaction.
 */
export const runDailyRetention = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    await ctx.scheduler.runAfter(0, internal.retention.pruneAnalyticsEvents, {
      before: now - RETENTION_MS.analyticsEvents,
    });
    await ctx.scheduler.runAfter(0, internal.retention.pruneAuditLogs, {
      before: now - RETENTION_MS.auditLogs,
    });
    await ctx.scheduler.runAfter(0, internal.retention.pruneWebhookDeliveries, {
      before: now - RETENTION_MS.webhookDeliveries,
    });
    await ctx.scheduler.runAfter(0, internal.retention.pruneAbandonedCarts, {
      before: now - RETENTION_MS.abandonedCarts,
    });
    await ctx.scheduler.runAfter(0, internal.retention.pruneGuestCarts, {
      before: now - RETENTION_MS.guestCarts,
    });
  },
});

export const pruneAnalyticsEvents = internalMutation({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (let batch = 0; batch < BATCHES_PER_CALL; batch++) {
      const rows = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_createdAt", (q) => q.lt("createdAt", args.before))
        .take(BATCH);
      for (const row of rows) await ctx.db.delete(row._id);
      deleted += rows.length;
      if (rows.length < BATCH) return deleted;
    }
    // Still had a full batch of work — continue in a fresh transaction.
    await ctx.scheduler.runAfter(0, internal.retention.pruneAnalyticsEvents, args);
    return deleted;
  },
});

export const pruneAuditLogs = internalMutation({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (let batch = 0; batch < BATCHES_PER_CALL; batch++) {
      const rows = await ctx.db
        .query("auditLogs")
        .withIndex("by_createdAt", (q) => q.lt("createdAt", args.before))
        .take(BATCH);
      for (const row of rows) await ctx.db.delete(row._id);
      deleted += rows.length;
      if (rows.length < BATCH) return deleted;
    }
    await ctx.scheduler.runAfter(0, internal.retention.pruneAuditLogs, args);
    return deleted;
  },
});

export const pruneWebhookDeliveries = internalMutation({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (let batch = 0; batch < BATCHES_PER_CALL; batch++) {
      const rows = await ctx.db
        .query("webhookDeliveries")
        .withIndex("by_createdAt", (q) => q.lt("createdAt", args.before))
        .take(BATCH);
      for (const row of rows) await ctx.db.delete(row._id);
      deleted += rows.length;
      if (rows.length < BATCH) return deleted;
    }
    await ctx.scheduler.runAfter(0, internal.retention.pruneWebhookDeliveries, args);
    return deleted;
  },
});

export const pruneAbandonedCarts = internalMutation({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (let batch = 0; batch < BATCHES_PER_CALL; batch++) {
      const rows = await ctx.db
        .query("abandonedCarts")
        .withIndex("by_createdAt", (q) => q.lt("createdAt", args.before))
        .take(BATCH);
      for (const row of rows) await ctx.db.delete(row._id);
      deleted += rows.length;
      if (rows.length < BATCH) return deleted;
    }
    await ctx.scheduler.runAfter(0, internal.retention.pruneAbandonedCarts, args);
    return deleted;
  },
});

/** Guest carts (flagged by `abandonedCarts.track`) past their short window. */
export const pruneGuestCarts = internalMutation({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (let batch = 0; batch < BATCHES_PER_CALL; batch++) {
      const rows = await ctx.db
        .query("abandonedCarts")
        .withIndex("by_isGuest_createdAt", (q) =>
          q.eq("isGuest", true).lt("createdAt", args.before)
        )
        .take(BATCH);
      for (const row of rows) await ctx.db.delete(row._id);
      deleted += rows.length;
      if (rows.length < BATCH) return deleted;
    }
    await ctx.scheduler.runAfter(0, internal.retention.pruneGuestCarts, args);
    return deleted;
  },
});

/**
 * One-off sweep for guest carts written before the `isGuest` flag existed.
 * Scans the `guest-` email prefix (bounded per call, no self-rescheduling) and
 * deletes matching rows. Run repeatedly until `scanned` drops below `maxRows`.
 */
export const sweepLegacyGuestCarts = internalMutation({
  args: { maxRows: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("abandonedCarts")
      .withIndex("by_email", (q) => q.gte("email", "guest-"))
      .take(args.maxRows ?? BATCH * BATCHES_PER_CALL);
    const guests = rows.filter((row) => isGuestEmail(row.email));
    for (const row of guests) await ctx.db.delete(row._id);
    return { scanned: rows.length, deleted: guests.length };
  },
});
