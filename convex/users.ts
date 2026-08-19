import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auditLog } from "./lib/audit";

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Admin email allowlist comes exclusively from the ADMIN_EMAILS env var
 * (comma-separated). Hardcoded defaults are intentionally removed so the
 * allowlist is not baked into the source.
 */
function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS ?? "";
  return Array.from(
    new Set(
      env
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

/**
 * Superadmin email allowlist comes exclusively from the SUPERADMIN_EMAILS env
 * var (comma-separated). Falls back to the admin allowlist so a single env var
 * is enough to bootstrap a superadmin.
 */
function getSuperAdminEmails(): string[] {
  const superEmails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...getAdminEmails(), ...superEmails]));
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export function isSuperAdminEmail(email: string): boolean {
  return getSuperAdminEmails().includes(email.toLowerCase());
}

async function findUserByIdentity(ctx: QueryCtx | MutationCtx) {
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

  // Last resort: lookup by email from identity
  const email = identity.email ?? (identity as { emailAddresses?: Array<{ emailAddress: string }> })?.emailAddresses?.[0]?.emailAddress;
  if (email) {
    users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .collect();
    if (users[0]) return users[0];
  }

  return null;
}

export async function requireAdmin(ctx: MutationCtx | QueryCtx): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: No authenticated user");
  }
  const user = await findUserByIdentity(ctx);
  if (user) {
    const level = ROLE_HIERARCHY[user.role] ?? 0;
    // SECURITY: requireAdmin is the STRICT admin gate (admin+). Destructive or
    // privileged ops (deletes, users, settings, storage, revenue, webhooks/API
    // keys, orders, customer writes) must NOT be reachable by editor/viewer.
    // Non-destructive content work should use requireEditor() instead.
    if (level < ROLE_HIERARCHY.admin) {
      throw new Error("Unauthorized: Admin access required");
    }
    // Backfill tokenIdentifier in mutation context for future fast lookups
    if ("patch" in ctx.db && user.tokenIdentifier !== identity.tokenIdentifier) {
      await ctx.db.patch(user._id, { tokenIdentifier: identity.tokenIdentifier });
    }
    return;
  }
  // Safety net: check admin email allowlist when user record not found.
  // This handles edge cases where the user record hasn't been created yet
  // (e.g. imported from dev, seedAdmin hasn't run yet).
  const email = (identity.email ?? "").toLowerCase();
  if (email && isAdminEmail(email)) return;
  throw new Error("Unauthorized: Admin access required");
}

/** Content-editor gate (editor+). For create/update of content an editor may
 * manage without full admin privileges (drafts, pricing, templates). */
export async function requireEditor(ctx: MutationCtx | QueryCtx): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: No authenticated user");
  }
  const user = await findUserByIdentity(ctx);
  if (user) {
    const level = ROLE_HIERARCHY[user.role] ?? 0;
    if (level < ROLE_HIERARCHY.editor) {
      throw new Error("Unauthorized: Editor access required");
    }
    return;
  }
  const email = (identity.email ?? "").toLowerCase();
  if (email && isAdminEmail(email)) return;
  throw new Error("Unauthorized: Editor access required");
}

export async function requireAdminSilent(ctx: MutationCtx | QueryCtx): Promise<boolean> {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await findUserByIdentity(ctx);
    if (user) {
      const level = ROLE_HIERARCHY[user.role] ?? 0;
      if (level < ROLE_HIERARCHY.editor) return false;
      // Backfill tokenIdentifier in mutation context for future fast lookups
      if ("patch" in ctx.db && user.tokenIdentifier !== identity.tokenIdentifier) {
        await ctx.db.patch(user._id, { tokenIdentifier: identity.tokenIdentifier });
      }
      return true;
    }
    // Safety net: check admin email allowlist when user record not found
    const email = (identity.email ?? "").toLowerCase();
    if (email && isAdminEmail(email)) return true;
    return false;
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

  // Last resort: lookup by email from identity
  const email = identity.email ?? (identity as { emailAddresses?: Array<{ emailAddress: string }> })?.emailAddresses?.[0]?.emailAddress;
  if (email) {
    users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
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

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Unauthorized");
    if (me._id !== args.id) throw new Error("Can only update your own profile");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(args.id, updates);
    return args.id;
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
    if (!(await requireAdminSilent(ctx))) return null;
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
    const isSuperAdmin = isSuperAdminEmail(args.email);
    const adminRole = isSuperAdmin ? "superadmin" : "admin";

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

    // SECURITY: Only a superadmin can assign superadmin or owner roles. An
    // admin may only assign roles at or below their own level.
    const actorLevel = ROLE_HIERARCHY[actor[0].role] ?? 0;
    const newRoleLevel = ROLE_HIERARCHY[args.role] ?? 0;
    if (newRoleLevel > actorLevel) {
      throw new Error(
        "Unauthorized: You cannot assign a role higher than your own"
      );
    }
    if ((args.role === "superadmin" || args.role === "owner") && actor[0].role !== "superadmin") {
      throw new Error("Unauthorized: Only a superadmin can assign superadmin or owner roles");
    }

    await ctx.db.patch(args.userId, { role: args.role, updatedAt: Date.now() });

    if (target.clerkId) {
      await ctx.scheduler.runAfter(0, internal.clerk.syncRoleToClerk, {
        clerkId: target.clerkId,
        role: args.role,
      });
    }

    await auditLog(ctx, {
      action: "user.role_change",
      entityType: "user",
      entityId: args.userId,
      summary: `Changed role of "${target.name ?? target.email}" from ${target.role} to ${args.role}`,
      changes: { from: target.role, to: args.role },
    });

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

    await auditLog(ctx, {
      action: "user.suspend",
      entityType: "user",
      entityId: args.userId,
      summary: `Suspended user "${target.name ?? target.email}"`,
    });

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

    await auditLog(ctx, {
      action: "user.activate",
      entityType: "user",
      entityId: args.userId,
      summary: `Activated user "${target.name ?? target.email}"`,
    });

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
    await auditLog(ctx, {
      action: "user.delete",
      entityType: "user",
      entityId: args.userId,
      summary: `Deleted user "${target.name ?? target.email}"`,
    });
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

    await auditLog(ctx, {
      action: "user.invite",
      entityType: "user",
      entityId: invitationId,
      summary: `Invited "${args.email}" as ${args.role}`,
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

    // Also try finding by email as fallback
    let existingByEmail: typeof existing = [];
    if (existing.length === 0) {
      existingByEmail = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .collect();
    }

    const foundUser = existing[0] ?? existingByEmail[0];
    if (foundUser) {
      // SECURITY: Only allow token update if:
      // 1. The caller's identity email matches the found user's email (self-linking), OR
      // 2. The caller is already an admin/superadmin
      // The identity email is verified by Clerk — never trust args.email for
      // authorization decisions.
      const identityEmail = identity.email ?? "";
      const callerEmail = identityEmail.toLowerCase();
      const isSelfLink = foundUser.email.toLowerCase() === callerEmail;

      let callerUser: { role: string } | null = null;
      if (!isSelfLink) {
        // Check if the CALLER (not the target) is already an admin
        callerUser = await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier)
          )
          .first();
      }
      const isCallerAdmin = !!callerUser &&
        ROLE_HIERARCHY[callerUser.role] >= ROLE_HIERARCHY.admin;

      if (!isSelfLink && !isCallerAdmin) {
        throw new Error("Unauthorized: Cannot modify another user's account");
      }

      // SECURITY: Role escalation to superadmin requires the CALLER to actually
      // be a superadmin — never base it on args.email (attacker-controlled).
      const callerIsSuperAdmin = !!callerUser &&
        ROLE_HIERARCHY[callerUser.role] >= ROLE_HIERARCHY.superadmin;
      const newRole = callerIsSuperAdmin && isCallerAdmin ? "superadmin" : foundUser.role;

      const now = Date.now();
      await ctx.db.patch(foundUser._id, {
        tokenIdentifier: identity.tokenIdentifier,
        clerkId: args.clerkId,
        // Self-linking: store the verified identity email, not args.email.
        email: isSelfLink ? (identityEmail.toLowerCase() || args.email) : args.email,
        name: args.name ?? foundUser.name,
        avatar: args.avatar ?? foundUser.avatar,
        role: newRole,
        updatedAt: now,
      });
      return foundUser._id;
    }

    // New user — check permissions.
    // SECURITY: All authorization must be derived from the identity verified by
    // Clerk, never from client-supplied args.email.
    const identityEmail = (identity.email ?? "").toLowerCase();
    const claims = identity as unknown as {
      role?: string;
      metadata?: { role?: string };
      publicMetadata?: { role?: string };
      email?: string;
    };
    const claimsRole =
      claims.role ?? claims.metadata?.role ?? claims.publicMetadata?.role;

    // Allow if: has admin role in Clerk claims OR identity email is in admin allowlist
    const hasClerkAdminRole = claimsRole === "admin" || claimsRole === "owner" || claimsRole === "superadmin";
    const hasAdminEmail = identityEmail.length > 0 && isAdminEmail(identityEmail);

    if (!hasClerkAdminRole && !hasAdminEmail) {
      throw new Error(
        "Unauthorized: Admin role required on Clerk session or admin email allowlist"
      );
    }

    const now = Date.now();
    const tokenIdentifier = identity.tokenIdentifier;
    const isSuperAdmin = identityEmail.length > 0 && isSuperAdminEmail(identityEmail);
    const assignedRole = isSuperAdmin ? "superadmin" : "admin";
    // Store the verified identity email, not args.email (which is attacker-controlled).
    const storedEmail = identityEmail || (args.email ?? "").toLowerCase();
    const id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      tokenIdentifier,
      email: storedEmail,
      name: args.name,
      avatar: args.avatar,
      role: assignedRole,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await auditLog(ctx, {
      action: "user.seed_admin",
      entityType: "user",
      entityId: id,
      summary: `Seeded admin account "${storedEmail}" as ${assignedRole}`,
    });
    return id;
  },
});

export const syncMyAccount = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { synced: false };

    // Find existing user by any means
    let user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (user) return { synced: true, id: user._id };

    // SECURITY: only rebind a record via clerkId when the supplied clerkId
    // matches the identity's own subject claim (verified by Clerk). This
    // prevents claiming another user's record by guessing/stealing their id.
    const identitySubject = identity.subject ?? identity.clerkId;
    if (args.clerkId && identitySubject && args.clerkId === identitySubject) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .first();
      if (user) {
        await ctx.db.patch(user._id, {
          tokenIdentifier: identity.tokenIdentifier,
          clerkId: args.clerkId,
          email: args.email || user.email,
          name: args.name ?? user.name,
          avatar: args.avatar ?? user.avatar,
          updatedAt: Date.now(),
        });
        return { synced: true, id: user._id };
      }
    }

    // Find by email — SECURITY: only claim a record whose email matches the
    // identity verified by Clerk. Never rebind based on client-supplied args.email.
    const identityEmail = (identity.email ?? "").toLowerCase();
    if (args.email && identityEmail && args.email.toLowerCase() === identityEmail) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();
      if (user) {
        await ctx.db.patch(user._id, {
          tokenIdentifier: identity.tokenIdentifier,
          clerkId: args.clerkId,
          email: args.email,
          name: args.name ?? user.name,
          avatar: args.avatar ?? user.avatar,
          updatedAt: Date.now(),
        });
        return { synced: true, id: user._id };
      }
    }

    // Not found — let seedAdmin handle new user creation
    return { synced: false };
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

// ======================== IAM Native Auth ========================

export const upsertNative = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("superadmin"), v.literal("owner"), v.literal("admin"), v.literal("editor"), v.literal("viewer"))),
    passwordHash: v.optional(v.string()),
    securityVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalized = args.email.toLowerCase().trim();
    const now = Date.now();
    const adminEmail = isAdminEmail(args.email);
    const isSuperAdmin = isSuperAdminEmail(args.email);
    const assignedRole = args.role ?? (isSuperAdmin ? "superadmin" : adminEmail ? "admin" : "viewer");

    if (args.userId) {
      const existing = await ctx.db.get(args.userId);
      if (existing) {
        const updates: Record<string, unknown> = {
          email: args.email,
          normalizedEmail: normalized,
          updatedAt: now,
          role: assignedRole,
        };
        if (args.name !== undefined) updates.name = args.name;
        if (args.passwordHash !== undefined) updates.passwordHash = args.passwordHash;
        if (args.securityVersion !== undefined) updates.securityVersion = args.securityVersion;
        await ctx.db.patch(args.userId, updates);
        return args.userId;
      }
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", normalized))
      .first();

    if (existing) {
      const updates: Record<string, unknown> = {
        email: args.email,
        normalizedEmail: normalized,
        updatedAt: now,
        role: assignedRole,
      };
      if (args.name !== undefined) updates.name = args.name;
      if (args.passwordHash !== undefined) updates.passwordHash = args.passwordHash;
      if (args.securityVersion !== undefined) updates.securityVersion = args.securityVersion;
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const clerkId = `tw_${Date.now().toString(36)}`;
    return await ctx.db.insert("users", {
      clerkId,
      tokenIdentifier: `trueworks|${clerkId}`,
      email: args.email,
      normalizedEmail: normalized,
      name: args.name,
      role: assignedRole,
      status: "active",
      createdAt: now,
      updatedAt: now,
      securityVersion: args.securityVersion ?? 0,
      loginCount: 0,
    });
  },
});

export const seedNativeAdmin = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalized = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", normalized))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        passwordHash: args.password,
        role: "superadmin",
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const clerkId = `tw_${Date.now().toString(36)}`;
    return await ctx.db.insert("users", {
      clerkId,
      tokenIdentifier: `trueworks|${clerkId}`,
      email: args.email,
      normalizedEmail: normalized,
      name: args.name ?? args.email.split("@")[0],
      role: "superadmin",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      securityVersion: 0,
      loginCount: 0,
      passwordHash: args.password,
      emailVerified: true,
    });
  },
});
