import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";
import { checkRateLimit } from "./rateLimit";

/**
 * Log an audit event. This is the primary entry point for all audit logging.
 * Auto-resolves the actor from the auth context.
 * Rate-limited to prevent log flooding from unauthenticated callers (webhooks, HTTP actions).
 */
export const log = mutation({
  args: {
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    summary: v.string(),
    changes: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    level: v.optional(v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical"),
    )),
    source: v.optional(v.union(
      v.literal("mutation"),
      v.literal("query"),
      v.literal("http"),
      v.literal("webhook"),
      v.literal("action"),
      v.literal("scheduler"),
    )),
    latencyMs: v.optional(v.number()),
    stackTrace: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Rate limit unauthenticated callers to prevent log flooding
    if (!identity) {
      await checkRateLimit(ctx, "auditLog:anonymous", args.entityId, 30, 60_000);
    }

    let actorId = undefined;
    let actorEmail = "unknown";
    let actorName = undefined;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .first();
      actorId = user?._id;
      actorEmail = user?.email ?? identity.email ?? "unknown";
      actorName = user?.name;
    }

    return await ctx.db.insert("auditLogs", {
      actorId,
      actorEmail,
      actorName,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      summary: args.summary,
      changes: args.changes,
      ipAddress: args.ipAddress,
      createdAt: Date.now(),
      level: args.level ?? "info",
      source: args.source,
      latencyMs: args.latencyMs,
      stackTrace: args.stackTrace,
      metadata: args.metadata,
    });
  },
});

/**
 * List audit logs with filtering, search, and pagination.
 */
export const list = query({
  args: {
    entityType: v.optional(v.string()),
    action: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    level: v.optional(v.string()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { logs: [], total: 0 };

    let q = ctx.db.query("auditLogs").withIndex("by_createdAt");

    if (args.startDate) {
      q = q.filter((q) => q.gte(q.field("createdAt"), args.startDate!));
    }
    if (args.endDate) {
      q = q.filter((q) => q.lte(q.field("createdAt"), args.endDate!));
    }
    if (args.entityType) {
      q = q.filter((q) => q.eq(q.field("entityType"), args.entityType!));
    }
    if (args.action) {
      q = q.filter((q) => q.eq(q.field("action"), args.action!));
    }
    if (args.actorEmail) {
      q = q.filter((q) =>
        q.eq(q.field("actorEmail"), args.actorEmail!)
      );
    }
    if (args.level) {
      q = q.filter((q) => q.eq(q.field("level"), args.level as any));
    }
    if (args.source) {
      q = q.filter((q) => q.eq(q.field("source"), args.source as any));
    }

    const all = await q.order("desc").collect();

    let filtered = all;
    if (args.search) {
      const s = args.search.toLowerCase();
      filtered = all.filter(
        (log) =>
          log.summary.toLowerCase().includes(s) ||
          log.actorEmail.toLowerCase().includes(s) ||
          log.entityType.toLowerCase().includes(s) ||
          log.entityId.toLowerCase().includes(s) ||
          log.action.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    const logs = filtered.slice(offset, offset + limit);

    return { logs, total };
  },
});

/**
 * Get audit log statistics — includes performance and error breakdowns.
 */
export const stats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) {
      return {
        total: 0, byAction: {}, byEntity: {}, byActor: {}, recentActivity: [],
        byLevel: {}, bySource: {}, errorCount: 0, warningCount: 0,
        avgLatencyMs: 0, p95LatencyMs: 0, slowOpsCount: 0,
      };
    }

    let q = ctx.db.query("auditLogs").withIndex("by_createdAt");

    if (args.startDate) {
      q = q.filter((q) => q.gte(q.field("createdAt"), args.startDate!));
    }
    if (args.endDate) {
      q = q.filter((q) => q.lte(q.field("createdAt"), args.endDate!));
    }

    const logs = await q.order("desc").collect();

    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
    const byActor: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    let errorCount = 0;
    let warningCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    const latencies: number[] = [];
    let slowOpsCount = 0;

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byEntity[log.entityType] = (byEntity[log.entityType] || 0) + 1;
      byActor[log.actorEmail] = (byActor[log.actorEmail] || 0) + 1;

      const level = log.level ?? "info";
      byLevel[level] = (byLevel[level] || 0) + 1;
      if (level === "error" || level === "critical") errorCount++;
      if (level === "warning") warningCount++;

      if (log.source) {
        bySource[log.source] = (bySource[log.source] || 0) + 1;
      }

      if (log.latencyMs != null) {
        totalLatency += log.latencyMs;
        latencyCount++;
        latencies.push(log.latencyMs);
        if (log.latencyMs > 2000) slowOpsCount++;
      }
    }

    // Calculate p95 latency
    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95LatencyMs = latencies.length > 0 ? latencies[p95Index] : 0;
    const avgLatencyMs = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

    const recentActivity = logs.slice(0, 20);

    return {
      total: logs.length,
      byAction,
      byEntity,
      byActor,
      recentActivity,
      byLevel,
      bySource,
      errorCount,
      warningCount,
      avgLatencyMs,
      p95LatencyMs,
      slowOpsCount,
    };
  },
});

/**
 * Get performance metrics — latency breakdown, slow operations, percentiles.
 */
export const performance = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) {
      return { slowOps: [], avgLatencyMs: 0, p50: 0, p95: 0, p99: 0, total: 0 };
    }

    let q = ctx.db.query("auditLogs").withIndex("by_createdAt");

    if (args.startDate) {
      q = q.filter((q) => q.gte(q.field("createdAt"), args.startDate!));
    }
    if (args.endDate) {
      q = q.filter((q) => q.lte(q.field("createdAt"), args.endDate!));
    }

    const logs = await q.order("desc").collect();
    const withLatency = logs.filter((l) => l.latencyMs != null);
    const latencies = withLatency.map((l) => l.latencyMs!).sort((a, b) => a - b);

    // Slow ops (sorted by latency desc)
    const slowOps = withLatency
      .sort((a, b) => (b.latencyMs ?? 0) - (a.latencyMs ?? 0))
      .slice(0, args.limit ?? 20)
      .map((l) => ({
        _id: l._id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        summary: l.summary,
        latencyMs: l.latencyMs,
        level: l.level,
        source: l.source,
        createdAt: l.createdAt,
        actorEmail: l.actorEmail,
      }));

    const percentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const idx = Math.floor(arr.length * p);
      return arr[Math.min(idx, arr.length - 1)];
    };

    return {
      slowOps,
      avgLatencyMs: latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
      total: withLatency.length,
    };
  },
});

/**
 * Get error log entries — recent errors with stack traces.
 */
export const errors = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { errors: [], total: 0 };

    let q = ctx.db.query("auditLogs").withIndex("by_createdAt");

    if (args.startDate) {
      q = q.filter((q) => q.gte(q.field("createdAt"), args.startDate!));
    }
    if (args.endDate) {
      q = q.filter((q) => q.lte(q.field("createdAt"), args.endDate!));
    }

    const all = await q.order("desc").collect();

    // Filter to errors and criticals only
    let filtered = all.filter((l) => l.level === "error" || l.level === "critical");

    if (args.source) {
      filtered = filtered.filter((l) => l.source === args.source);
    }

    const total = filtered.length;
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    const errors = filtered.slice(offset, offset + limit);

    return { errors, total };
  },
});

/**
 * Get unique error actions/types for filtering.
 */
export const uniqueErrorActions = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];

    let q = ctx.db.query("auditLogs").withIndex("by_createdAt");

    if (args.startDate) {
      q = q.filter((q) => q.gte(q.field("createdAt"), args.startDate!));
    }
    if (args.endDate) {
      q = q.filter((q) => q.lte(q.field("createdAt"), args.endDate!));
    }

    const logs = await q.collect();
    const errorLogs = logs.filter((l) => l.level === "error" || l.level === "critical");
    const actions = [...new Set(errorLogs.map((l) => l.action))];
    return actions.sort();
  },
});

/**
 * Get a single audit log by ID.
 */
export const getById = query({
  args: { id: v.id("auditLogs") },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return null;
    return await ctx.db.get(args.id);
  },
});

/**
 * Delete old audit logs (cleanup).
 */
export const cleanup = mutation({
  args: { olderThan: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cutoff = Date.now() - args.olderThan;
    const old = await ctx.db
      .query("auditLogs")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
      .collect();
    for (const log of old) {
      await ctx.db.delete(log._id);
    }
    return old.length;
  },
});

/**
 * Get unique actor emails for filter dropdown.
 */
export const uniqueActors = query({
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const logs = await ctx.db.query("auditLogs").collect();
    const emails = [...new Set(logs.map((l) => l.actorEmail))];
    return emails.sort();
  },
});

/**
 * Get unique entity types for filter dropdown.
 */
export const uniqueEntityTypes = query({
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const logs = await ctx.db.query("auditLogs").collect();
    const types = [...new Set(logs.map((l) => l.entityType))];
    return types.sort();
  },
});
