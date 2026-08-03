import type { GenericMutationCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

type Ctx = GenericMutationCtx<DataModel>;

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
  });
}
