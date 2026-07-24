import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";

const DEFAULT_ADMIN_EMAILS = ["musinguzie612@gmail.com"];

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
  if (!user[0] || user[0].role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const users = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .collect();
  return users[0] ?? null;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").order("desc").take(100);
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
    return user?.role === "admin";
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
    publicRole: v.optional(v.union(v.literal("admin"), v.literal("customer"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();

    const now = Date.now();
    const adminEmail = isAdminEmail(args.email);
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        tokenIdentifier: args.tokenIdentifier,
        email: args.email,
        name: args.name,
        avatar: args.avatar,
        role: adminEmail ? "admin" : (args.publicRole ?? existing[0].role),
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
      role: adminEmail ? "admin" : (args.publicRole ?? "customer"),
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
    role: v.union(v.literal("admin"), v.literal("customer")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { role: args.role, updatedAt: Date.now() });
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

    const claims = identity as unknown as {
      role?: string;
      metadata?: { role?: string };
      publicMetadata?: { role?: string };
      email?: string;
    };
    const claimsRole =
      claims.role ?? claims.metadata?.role ?? claims.publicMetadata?.role;
    if (claimsRole !== "admin" && !isAdminEmail(args.email)) {
      throw new Error(
        "Unauthorized: Admin role required on Clerk session or admin email allowlist"
      );
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    const now = Date.now();
    const tokenIdentifier = `${process.env.CLERK_JWT_ISSUER_DOMAIN ?? ""}|${args.clerkId}`;
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        role: "admin",
        tokenIdentifier,
        email: args.email,
        name: args.name ?? existing[0].name,
        avatar: args.avatar ?? existing[0].avatar,
        updatedAt: now,
      });
      return existing[0]._id;
    }
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      tokenIdentifier,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: "admin",
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
