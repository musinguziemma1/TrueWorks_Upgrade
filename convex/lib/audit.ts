import type { GenericMutationCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

type Ctx = GenericMutationCtx<DataModel>;

type LogLevel = "info" | "warning" | "error" | "critical";
type EventSource = "mutation" | "query" | "http" | "webhook" | "action" | "scheduler";

/**
 * Helper to insert an audit log from within any Convex mutation.
 * Resolves the actor from the auth context automatically.
 */
export async function auditLog(
  ctx: Ctx,
  args: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    level?: LogLevel;
    source?: EventSource;
    latencyMs?: number;
    metadata?: Record<string, unknown>;
  }
) {
  const identity = await ctx.auth.getUserIdentity();
  const actor = identity
    ? await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .first()
    : null;

  return await ctx.db.insert("auditLogs", {
    actorId: actor?._id,
    actorEmail: actor?.email ?? identity?.email ?? "system",
    actorName: actor?.name,
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
    metadata: args.metadata,
  });
}

/**
 * Log a performance event (slow operation, high latency, etc.).
 */
export async function performanceLog(
  ctx: Ctx,
  args: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    latencyMs: number;
    level?: "info" | "warning" | "error";
    source?: EventSource;
    metadata?: Record<string, unknown>;
  }
) {
  const identity = await ctx.auth.getUserIdentity();
  const actor = identity
    ? await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .first()
    : null;

  // Auto-escalate level based on latency thresholds
  let level = args.level ?? "info";
  if (!args.level) {
    if (args.latencyMs > 5000) level = "error";
    else if (args.latencyMs > 2000) level = "warning";
  }

  return await ctx.db.insert("auditLogs", {
    actorId: actor?._id,
    actorEmail: actor?.email ?? identity?.email ?? "system",
    actorName: actor?.name,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    summary: args.summary,
    createdAt: Date.now(),
    level,
    source: args.source ?? "mutation",
    latencyMs: args.latencyMs,
    metadata: args.metadata,
  });
}

/**
 * Log an error event with stack trace and context.
 */
export async function errorLog(
  ctx: Ctx,
  args: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    error: Error | string;
    source?: EventSource;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }
) {
  const identity = await ctx.auth.getUserIdentity();
  const actor = identity
    ? await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .first()
    : null;

  const errorObj = typeof args.error === "string" ? new Error(args.error) : args.error;

  return await ctx.db.insert("auditLogs", {
    actorId: actor?._id,
    actorEmail: actor?.email ?? identity?.email ?? "system",
    actorName: actor?.name,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    summary: args.summary,
    createdAt: Date.now(),
    level: "error",
    source: args.source ?? "mutation",
    stackTrace: errorObj.stack,
    ipAddress: args.ipAddress,
    metadata: {
      ...args.metadata,
      errorMessage: errorObj.message,
      errorName: errorObj.name,
    },
  });
}

/**
 * Measure and log the execution time of an async operation.
 * Returns the result of the operation.
 *
 * Usage:
 * ```ts
 * const result = await measureAndLog(ctx, {
 *   action: "checkout.create",
 *   entityType: "order",
 *   entityId: "new",
 *   summary: "Checkout flow",
 *   source: "http",
 * }, async () => {
 *   // ... do work
 *   return order;
 * });
 * ```
 */
export async function measureAndLog<T>(
  ctx: Ctx,
  args: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    source?: EventSource;
    warnThresholdMs?: number;
    metadata?: Record<string, unknown>;
  },
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let result: T;
  let error: Error | undefined;

  try {
    result = await fn();
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));

    // Log the error
    await errorLog(ctx, {
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      summary: `${args.summary} — FAILED`,
      error,
      source: args.source,
      metadata: args.metadata,
    });

    throw error;
  }

  const latencyMs = Date.now() - start;
  const warnThreshold = args.warnThresholdMs ?? 2000;

  // Only log if slow or if we want to always track
  if (latencyMs > warnThreshold) {
    await performanceLog(ctx, {
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      summary: `${args.summary} — ${latencyMs}ms`,
      latencyMs,
      source: args.source,
      metadata: args.metadata,
    });
  }

  return result;
}
