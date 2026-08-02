import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";

const DEFAULT_ADMIN_EMAILS = ["musinguzie612@gmail.com"];
const SUPERADMIN_EMAILS = ["musinguzie612@gmail.com"];

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS;
  const fromEnv = env
    ? env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return Array.from(
    new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv])
  );
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export async function requireAdmin(ctx: MutationCtx | QueryCtx): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: No authenticated user");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .collect();
  const level = (user[0] && ROLE_HIERARCHY[user[0].role]) ?? 0;
  if (!user[0] || level < ROLE_HIERARCHY.editor) {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function requireAdminSilent(ctx: MutationCtx | QueryCtx): Promise<boolean> {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    const level = (user[0] && ROLE_HIERARCHY[user[0].role]) ?? 0;
    if (!user[0] || level < ROLE_HIERARCHY.editor) return false;
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Try tokenIdentifier lookup first
  let users = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .collect();
  if (users[0]) return users[0];

  // Fallback: lookup by Clerk ID (sub claim)
  if (identity.subject) {
    users = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .collect();
    if (users[0]) return users[0];
  }

  return null;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];
    return await ctx.db.query("users").order("desc").take(200);
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return user?.role === "admin" || user?.role === "owner" || user?.role === "superadmin";
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    return results[0] ?? null;
  },
});

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    publicRole: v.optional(v.union(v.literal("superadmin"), v.literal("owner"), v.literal("admin"), v.literal("editor"), v.literal("viewer"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();

    const now = Date.now();
    const adminEmail = isAdminEmail(args.email);
    const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(args.email.toLowerCase());
    const adminRole = isSuperAdminEmail ? "superadmin" : "admin";

    // Check for pending invitation to determine role
    let invitationRole: string | undefined;
    if (!adminEmail) {
      const pendingInvitations = await ctx.db
        .query("invitations")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .collect();
      const pending = pendingInvitations.find(
        (inv) => inv.status === "pending" && inv.expiresAt > now
      );
      if (pending) {
        invitationRole = pending.role;
        // Mark invitation as accepted
        await ctx.db.patch(pending._id, { status: "accepted" });
      }
    }

    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        tokenIdentifier: args.tokenIdentifier,
        email: args.email,
        name: args.name,
        avatar: args.avatar,
        role: adminEmail ? adminRole : (invitationRole as typeof args.publicRole) ?? args.publicRole ?? existing[0].role,
        status: existing[0].status ?? "active",
        lastLoginAt: now,
        loginCount: (existing[0].loginCount ?? 0) + 1,
        updatedAt: now,
      });
      return existing[0]._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      tokenIdentifier: args.tokenIdentifier,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: adminEmail ? adminRole : (invitationRole as typeof args.publicRole) ?? args.publicRole ?? "viewer",
      status: "active",
      lastLoginAt: now,
      loginCount: 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("superadmin"), v.literal("owner"), v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
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

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === "owner") throw new Error("Cannot change the owner's role");
    if (target.role === "superadmin" && actor[0].role !== "superadmin") throw new Error("Only a superadmin can change another superadmin's role");
    if (actor[0]._id === args.userId && args.role !== "owner") {
      throw new Error("Cannot change your own role");
    }

    await ctx.db.patch(args.userId, { role: args.role, updatedAt: Date.now() });

    if (target.clerkId) {
      await ctx.scheduler.runAfter(0, internal.clerk.syncRoleToClerk, {
        clerkId: target.clerkId,
        role: args.role,
      });
    }

    return null;
  },
});

export const suspendUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const actor = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    if (!actor[0] || actor[0].role !== "superadmin") {
      throw new Error("Unauthorized: Superadmin access required to suspend users");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === "owner") throw new Error("Cannot suspend the owner");
    if (target.role === "superadmin") throw new Error("Cannot suspend a superadmin");
    if (actor[0]._id === args.userId) throw new Error("Cannot suspend yourself");

    await ctx.db.patch(args.userId, { status: "suspended", updatedAt: Date.now() });

    if (target.clerkId) {
      await ctx.scheduler.runAfter(0, internal.clerk.suspendClerkUser, {
        clerkId: target.clerkId,
      });
    }

    return null;
  },
});

export const activateUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const actor = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    if (!actor[0] || actor[0].role !== "superadmin") {
      throw new Error("Unauthorized: Superadmin access required to activate users");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    await ctx.db.patch(args.userId, { status: "active", updatedAt: Date.now() });

    if (target.clerkId) {
      await ctx.scheduler.runAfter(0, internal.clerk.activateClerkUser, {
        clerkId: target.clerkId,
      });
    }

    return null;
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const actor = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    if (!actor[0] || actor[0].role !== "superadmin") {
      throw new Error("Unauthorized: Superadmin access required to delete users");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === "owner") throw new Error("Cannot delete the owner");
    if (target.role === "superadmin") throw new Error("Cannot delete a superadmin");
    if (actor[0]._id === args.userId) throw new Error("Cannot delete yourself");

    if (target.clerkId) {
      await ctx.scheduler.runAfter(0, internal.clerk.deleteClerkUser, {
        clerkId: target.clerkId,
      });
    }

    await ctx.db.delete(args.userId);
    return null;
  },
});

export const inviteUser = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
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

    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    if (existing.length > 0) throw new Error("User with this email already exists in the system");

    // Check for existing pending invitation
    const pendingInvitations = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    const activePending = pendingInvitations.find(
      (inv) => inv.status === "pending" && inv.expiresAt > Date.now()
    );
    if (activePending) throw new Error("An active invitation already exists for this email");

    const now = Date.now();
    const EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

    // Store invitation in Convex first
    const invitationId = await ctx.db.insert("invitations", {
      email: args.email,
      role: args.role,
      invitedBy: actor[0].email,
      invitedByName: actor[0].name,
      status: "pending",
      createdAt: now,
      expiresAt: now + EXPIRY_MS,
    });

    // Create Clerk invitation (sends Clerk's default email)
    await ctx.scheduler.runAfter(0, internal.clerk.inviteClerkUser, {
      email: args.email,
      role: args.role,
    });

    // Send branded invitation email via Resend
    await ctx.scheduler.runAfter(0, internal.email.sendTeamInvitation, {
      to: args.email,
      role: args.role,
      invitedBy: actor[0].name || actor[0].email,
      invitationId,
    });

    return { invitationId };
  },
});

export const seedAdmin = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized: No authenticated user");

    // Check if user already exists — if so, just ensure they have a role
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    if (existing.length > 0) {
      // User already exists — update tokenIdentifier and return
      const now = Date.now();
      const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(args.email.toLowerCase());
      await ctx.db.patch(existing[0]._id, {
        tokenIdentifier: identity.tokenIdentifier,
        email: args.email,
        name: args.name ?? existing[0].name,
        avatar: args.avatar ?? existing[0].avatar,
        role: isSuperAdminEmail ? "superadmin" : existing[0].role,
        updatedAt: now,
      });
      return existing[0]._id;
    }

    // New user — check permissions
    const claims = identity as unknown as {
      role?: string;
      metadata?: { role?: string };
      publicMetadata?: { role?: string };
      email?: string;
    };
    const claimsRole =
      claims.role ?? claims.metadata?.role ?? claims.publicMetadata?.role;
    if (claimsRole !== "admin" && claimsRole !== "owner" && claimsRole !== "superadmin" && !isAdminEmail(args.email)) {
      throw new Error(
        "Unauthorized: Admin role required on Clerk session or admin email allowlist"
      );
    }

    const now = Date.now();
    const tokenIdentifier = identity.tokenIdentifier;
    const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(args.email.toLowerCase());
    const assignedRole = isSuperAdminEmail ? "superadmin" : "admin";
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      tokenIdentifier,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: assignedRole,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    if (existing.length > 0) {
      await ctx.db.delete(existing[0]._id);
    }
  },
});
