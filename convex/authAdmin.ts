import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";
import { revokeSession } from "./lib/sessions";

/**
 * Admin IAM management surface. All functions are admin-gated server-side;
 * the frontend never trusts roles. Exposes session and security-event data
 * across all users for the admin "Auth & Security" page.
 */

export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) {
      return { sessions: 0, events24h: 0, activeUsers: 0, lockedOut: 0 };
    }
    const [sessions, events, users] = await Promise.all([
      ctx.db.query("sessions").collect(),
      ctx.db
        .query("securityEvents")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", Date.now() - 24 * 60 * 60 * 1000))
        .collect(),
      ctx.db.query("users").collect(),
    ]);
    const activeSessions = sessions.filter(
      (s) => !s.revoked && s.absoluteExpiresAt > Date.now()
    ).length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    return {
      sessions: activeSessions,
      events24h: events.length,
      activeUsers,
      lockedOut: 0,
    };
  },
});

export const listAllSessions = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const limit = Math.min(args.limit ?? 100, 200);
    const offset = args.offset ?? 0;
    const rows = await ctx.db
      .query("sessions")
      .order("desc")
      .take(limit + offset);

    return await Promise.all(
      rows.slice(offset).map(async (s) => {
        const user = await ctx.db.get(s.userId);
        return {
          _id: s._id,
          userId: s.userId,
          email: user?.email ?? "Unknown",
          name: user?.name,
          role: user?.role,
          createdAt: s.createdAt,
          lastActiveAt: s.lastActiveAt,
          absoluteExpiresAt: s.absoluteExpiresAt,
          idleExpiresAt: s.idleExpiresAt,
          revoked: s.revoked,
          revokedAt: s.revokedAt,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
        };
      })
    );
  },
});

export const listAllSecurityEvents = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const limit = Math.min(args.limit ?? 100, 200);
    const offset = args.offset ?? 0;
    const rows = await ctx.db
      .query("securityEvents")
      .order("desc")
      .take(limit + offset);

    return await Promise.all(
      rows.slice(offset).map(async (e) => {
        const user = e.userId ? await ctx.db.get(e.userId).catch(() => null) : null;
        return {
          _id: e._id,
          action: e.action,
          result: e.result,
          createdAt: e.createdAt,
          userId: e.userId,
          email: user?.email ?? null,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
          metadata: e.metadata,
        };
      })
    );
  },
});

export const revokeAnySession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    await revokeSession(ctx, args.sessionId);
    return { ok: true, userId: session.userId };
  },
});
