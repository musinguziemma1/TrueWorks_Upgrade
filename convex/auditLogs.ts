import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

export const list = query({
  args: {
    entityType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const q = args.entityType
      ? ctx.db.query("auditLogs").withIndex("by_entityType", (q) => q.eq("entityType", args.entityType!))
      : ctx.db.query("auditLogs").withIndex("by_createdAt", (q) => q);
    return await q.order("desc").take(args.limit ?? 100);
  },
});

export const create = mutation({
  args: {
    actorEmail: v.string(),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    changes: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await requireAdminSilent(ctx);
    const identity = await ctx.auth.getUserIdentity();
    let actorId = undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
      actorId = user?._id;
    }
    const now = Date.now();
    return await ctx.db.insert("auditLogs", {
      actorId,
      actorEmail: args.actorEmail,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      changes: args.changes,
      ipAddress: args.ipAddress,
      createdAt: now,
    });
  },
});
