import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

/**
 * Log an audit event. This is the primary entry point for all audit logging.
 * Auto-resolves the actor from the auth context.
 */
export const log = mutation({
  args: {
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    summary: v.string(),
    changes: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    return await ctx.db.insert("auditLogs", {
      actorId: user?._id,
      actorEmail: user?.email ?? identity.email ?? "unknown",
      actorName: user?.name,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      summary: args.summary,
      changes: args.changes,
      ipAddress: args.ipAddress,
      createdAt: Date.now(),
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
 * Get audit log statistics.
 */
export const stats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) {
      return { total: 0, byAction: {}, byEntity: {}, byActor: {}, recentActivity: [] };
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

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byEntity[log.entityType] = (byEntity[log.entityType] || 0) + 1;
      byActor[log.actorEmail] = (byActor[log.actorEmail] || 0) + 1;
    }

    const recentActivity = logs.slice(0, 20);

    return { total: logs.length, byAction, byEntity, byActor, recentActivity };
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
