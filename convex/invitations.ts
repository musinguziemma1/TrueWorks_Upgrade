import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { auditLog } from "./lib/audit";

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    const level = (user[0] && ROLE_HIERARCHY[user[0].role]) ?? 0;
    if (!user[0] || level < ROLE_HIERARCHY.admin) return [];

    const now = Date.now();
    const all = await ctx.db.query("invitations").order("desc").take(100);

    // Return all, letting client filter expired ones
    return all.map((inv) => ({
      ...inv,
      status: inv.status === "pending" && inv.expiresAt < now ? ("expired" as const) : inv.status,
    }));
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    const level = (user[0] && ROLE_HIERARCHY[user[0].role]) ?? 0;
    if (!user[0] || level < ROLE_HIERARCHY.admin) return [];

    const now = Date.now();
    const all = await ctx.db.query("invitations").order("desc").take(100);

    return all.map((inv) => ({
      ...inv,
      status: inv.status === "pending" && inv.expiresAt < now ? ("expired" as const) : inv.status,
    }));
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const actor = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    if (!actor[0] || actor[0].role !== "superadmin") {
      throw new Error("Unauthorized: Superadmin access required to revoke invitations");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") throw new Error("Can only revoke pending invitations");

    await ctx.db.patch(args.invitationId, { status: "revoked" });
    await auditLog(ctx, {
      action: "invitation.revoke",
      entityType: "invitation",
      entityId: args.invitationId,
      summary: `Revoked invitation for "${invitation.email}"`,
    });
    return null;
  },
});

export const resend = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const actor = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    if (!actor[0] || (ROLE_HIERARCHY[actor[0].role] ?? 0) < ROLE_HIERARCHY.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status === "accepted") throw new Error("User already accepted this invitation");

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), invitation.email))
      .collect();
    if (existingUser.length > 0) throw new Error("This user already has an account");

    const now = Date.now();
    const EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

    // Update invitation record
    await ctx.db.patch(args.invitationId, {
      status: "pending",
      createdAt: now,
      expiresAt: now + EXPIRY_MS,
    });

    // Send branded email
    await ctx.scheduler.runAfter(0, internal.email.sendTeamInvitation, {
      to: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedByName || invitation.invitedBy,
      invitationId: args.invitationId,
    });

    await auditLog(ctx, {
      action: "invitation.resend",
      entityType: "invitation",
      entityId: args.invitationId,
      summary: `Resent invitation to "${invitation.email}"`,
    });

    return null;
  },
});

export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    if (!user[0] || user[0].role !== "superadmin") {
      throw new Error("Unauthorized: Superadmin access required");
    }

    const now = Date.now();
    const expired = await ctx.db
      .query("invitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    let count = 0;
    for (const inv of expired) {
      if (inv.expiresAt < now) {
        await ctx.db.patch(inv._id, { status: "expired" });
        count++;
      }
    }
    return { expired: count };
  },
});
