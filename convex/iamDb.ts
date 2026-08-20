/* eslint-disable @typescript-eslint/no-explicit-any */
// Fine-grained database operations backing the IAM HTTP handlers.
//
// Convex `httpAction` handlers do NOT have `ctx.db` — only runQuery,
// runMutation, runAction, scheduler, storage and auth. All raw database
// access for the IAM endpoints therefore lives here (in default-runtime
// mutations/queries, which do have `ctx.db`), and the handlers in iam.ts
// call these via `ctx.runMutation` / `ctx.runQuery`.

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail, sha256Hex } from "./lib/tokens";
import {
  SESSION_IDLE_MS,
  SESSION_ABSOLUTE_MS,
  SESSION_ABSOLUTE_REMEMBER_MS,
} from "./lib/sessions";

// ======================== QUERIES ========================

export const findUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = normalizeEmail(email);
    return await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", normalized))
      .first();
  },
});

export const findSessionByTokenHash = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();
  },
});

export const getDoc = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id as any);
  },
});

export const findVerificationTokensByHash = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    return await ctx.db
      .query("verificationTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .collect();
  },
});

export const findMfaFactorByUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("mfaFactors")
      .withIndex("by_userId", (q) => q.eq("userId", userId as any))
      .first();
  },
});

export const findRecoveryCodeByHash = internalQuery({
  args: { codeHash: v.string() },
  handler: async (ctx, { codeHash }) => {
    return await ctx.db
      .query("recoveryCodes")
      .withIndex("by_codeHash", (q) => q.eq("codeHash", codeHash))
      .first();
  },
});

export const listSessionsForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId as any))
      .order("desc")
      .collect();
  },
});

export const listSecurityEventsForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("securityEvents")
      .withIndex("by_userId", (q) => q.eq("userId", userId as any))
      .order("desc")
      .take(50);
  },
});

// ======================== MUTATIONS ========================

export const validateSession = internalMutation({
  args: { rawToken: v.string() },
  handler: async (ctx, { rawToken }) => {
    const tokenHash = await sha256Hex(rawToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!session) return { valid: false };
    if (session.revoked) return { valid: false };
    if (Date.now() > session.absoluteExpiresAt) return { valid: false };
    if (Date.now() > session.idleExpiresAt) return { valid: false };

    await ctx.db.patch(session._id, {
      lastActiveAt: Date.now(),
      idleExpiresAt: Date.now() + SESSION_IDLE_MS,
    });

    const user = await ctx.db.get(session.userId);
    if (!user) return { valid: false };

    return { valid: true, session, user };
  },
});

export const checkRateLimit = internalMutation({
  args: { key: v.string(), windowMs: v.number(), maxAttempts: v.number() },
  handler: async (ctx, { key, windowMs, maxAttempts }) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing && existing.windowStart > windowStart) {
      if (existing.count >= maxAttempts) {
        return { allowed: false, remaining: 0 };
      }
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
      return { allowed: true, remaining: maxAttempts - existing.count - 1 };
    }

    await ctx.db.insert("rateLimits", { key, windowStart: now, count: 1 });
    return { allowed: true, remaining: maxAttempts - 1 };
  },
});

export const insertUser = internalMutation({
  args: {
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    email: v.string(),
    normalizedEmail: v.string(),
    emailVerified: v.boolean(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    securityVersion: v.number(),
    loginCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", { ...args } as any);
  },
});

export const createSession = internalMutation({
  args: {
    userId: v.string(),
    rawToken: v.string(),
    rememberMe: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.rawToken);
    const now = Date.now();
    const absoluteMs = args.rememberMe ? SESSION_ABSOLUTE_REMEMBER_MS : SESSION_ABSOLUTE_MS;

    return await ctx.db.insert("sessions", {
      tokenHash,
      userId: args.userId as any,
      createdAt: now,
      lastActiveAt: now,
      idleExpiresAt: now + SESSION_IDLE_MS,
      absoluteExpiresAt: now + absoluteMs,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      revoked: false,
    });
  },
});

export const patchDoc = internalMutation({
  args: { id: v.string(), fields: v.any() },
  handler: async (ctx, { id, fields }) => {
    await ctx.db.patch(id as any, fields);
  },
});

export const deleteDoc = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id as any);
  },
});

export const revokeSession = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id as any, { revoked: true, revokedAt: Date.now() });
  },
});

export const revokeAllSessions = internalMutation({
  args: { userId: v.string(), exceptSessionId: v.optional(v.string()) },
  handler: async (ctx, { userId, exceptSessionId }) => {
    const now = Date.now();
    const all = await ctx.db
      .query("sessions")
      .withIndex("by_userId_revoked", (q) => q.eq("userId", userId as any).eq("revoked", false))
      .collect();

    let count = 0;
    for (const s of all) {
      if (exceptSessionId && s._id === exceptSessionId) continue;
      await ctx.db.patch(s._id, { revoked: true, revokedAt: now });
      count++;
    }
    return count;
  },
});

export const createVerificationToken = internalMutation({
  args: { email: v.string(), type: v.string(), expiresInMs: v.number() },
  handler: async (ctx, { email, type, expiresInMs }) => {
    const rawToken = await sha256Hex(`${email}:${type}:${Date.now()}:${Math.random()}`);
    const tokenHash = await sha256Hex(rawToken);
    const now = Date.now();

    await ctx.db.insert("verificationTokens", {
      email,
      tokenHash,
      type,
      expiresAt: now + expiresInMs,
      createdAt: now,
    });

    return { rawToken };
  },
});

export const consumeVerificationToken = internalMutation({
  args: { token: v.string(), type: v.string() },
  handler: async (ctx, { token, type }) => {
    const tokenHash = await sha256Hex(token);
    const all = await ctx.db
      .query("verificationTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .collect();

    const found = all.find((t: any) => t.type === type && !t.usedAt && t.expiresAt > Date.now());
    if (!found) return null;

    await ctx.db.patch(found._id, { usedAt: Date.now() });
    return { email: found.email };
  },
});

export const insertVerificationToken = internalMutation({
  args: {
    email: v.string(),
    tokenHash: v.string(),
    type: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("verificationTokens", {
      email: args.email,
      tokenHash: args.tokenHash,
      type: args.type,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const recordLoginAttempt = internalMutation({
  args: {
    email: v.string(),
    success: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("loginAttempts", {
      email: args.email,
      success: args.success,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});

export const recordSecurityEvent = internalMutation({
  args: {
    userId: v.string(),
    action: v.string(),
    result: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("securityEvents", {
      userId: args.userId as any,
      action: args.action,
      result: args.result,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const insertMfaFactor = internalMutation({
  args: { userId: v.string(), secret: v.string() },
  handler: async (ctx, { userId, secret }) => {
    return await ctx.db.insert("mfaFactors", {
      userId: userId as any,
      secret,
      verified: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const insertRecoveryCodes = internalMutation({
  args: { userId: v.string(), codeHashes: v.array(v.string()) },
  handler: async (ctx, { userId, codeHashes }) => {
    const now = Date.now();
    for (const codeHash of codeHashes) {
      await ctx.db.insert("recoveryCodes", {
        userId: userId as any,
        codeHash,
        used: false,
        createdAt: now,
      });
    }
  },
});

export const deleteRecoveryCodesForUser = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db
      .query("recoveryCodes")
      .withIndex("by_userId_used", (q) => q.eq("userId", userId as any))
      .collect();
    for (const c of all) await ctx.db.delete(c._id);
  },
});

export const recordFailedLoginAttempt = internalMutation({
  args: { ipAddress: v.optional(v.string()), userAgent: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.insert("loginAttempts", {
      email: "",
      success: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});

export const purgeUser = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = normalizeEmail(email);
    const user = await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", normalized))
      .first();
    if (!user) return { deletedUser: false, deletedRows: 0 };

    const userId = user._id;
    let deletedRows = 0;

    const deleteWhere = async (
      table: "sessions" | "mfaFactors" | "recoveryCodes" | "securityEvents",
      index: string,
    ) => {
      const rows = await ctx.db.query(table).withIndex(index as any, (q) => q.eq("userId", userId as any)).collect();
      for (const r of rows) {
        await ctx.db.delete(r._id);
        deletedRows++;
      }
    };

    await deleteWhere("sessions", "by_userId");
    await deleteWhere("mfaFactors", "by_userId");
    await deleteWhere("recoveryCodes", "by_userId_used");
    await deleteWhere("securityEvents", "by_userId");

    const vt = await ctx.db
      .query("verificationTokens")
      .withIndex("by_email_type", (q) => q.eq("email", user.email))
      .collect();
    for (const r of vt) {
      await ctx.db.delete(r._id);
      deletedRows++;
    }

    for (const table of ["loginAttempts", "passwordResetTokens"] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex("by_email", (q) => q.eq("email", user.email))
        .collect();
      for (const r of rows) {
        await ctx.db.delete(r._id);
        deletedRows++;
      }
    }

    await ctx.db.delete(user._id);
    return { deletedUser: true, deletedRows: deletedRows + 1 };
  },
});