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
import { normalizeEmail, sha256Hex, randomToken } from "./lib/tokens";
import { internal } from "./_generated/api";
import {
  SESSION_IDLE_MS,
  SESSION_ABSOLUTE_MS,
  SESSION_ABSOLUTE_REMEMBER_MS,
} from "./lib/sessions";

const USER_ROLE = v.union(
  v.literal("superadmin"),
  v.literal("owner"),
  v.literal("admin"),
  v.literal("editor"),
  v.literal("viewer")
);

// ======================== SHARED HELPERS ========================

async function rateLimitState(
  ctx: any,
  key: string,
  now: number,
  windowMs: number,
  maxAttempts: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = now - windowMs;
  const existing = await (ctx.db.query("rateLimits") as any)
    .withIndex("by_key", (q: any) => q.eq("key", key))
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
}

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

// ======================== PASSKEYS (WebAuthn) ========================

export const findPasskeyByCredentialId = internalQuery({
  args: { credentialId: v.string() },
  handler: async (ctx, { credentialId }) => {
    return await ctx.db
      .query("passkeyCredentials")
      .withIndex("by_credentialId", (q) => q.eq("credentialId", credentialId))
      .first();
  },
});

export const listPasskeysForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("passkeyCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", userId as any))
      .collect();
  },
});

export const findWebauthnChallenge = internalQuery({
  args: { challengeHash: v.string() },
  handler: async (ctx, { challengeHash }) => {
    return await ctx.db
      .query("webauthnChallenges")
      .withIndex("by_challengeHash", (q) => q.eq("challengeHash", challengeHash))
      .first();
  },
});

export const insertPasskeyCredential = internalMutation({
  args: {
    userId: v.string(),
    credentialId: v.string(),
    publicKey: v.string(),
    counter: v.number(),
    transports: v.optional(v.array(v.string())),
    deviceType: v.optional(v.string()),
    backedUp: v.optional(v.boolean()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("passkeyCredentials", {
      userId: args.userId as any,
      credentialId: args.credentialId,
      publicKey: args.publicKey,
      counter: args.counter,
      transports: args.transports,
      deviceType: args.deviceType,
      backedUp: args.backedUp,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const updatePasskeyCounter = internalMutation({
  args: { id: v.string(), counter: v.number(), lastUsedAt: v.number() },
  handler: async (ctx, { id, counter, lastUsedAt }) => {
    await ctx.db.patch(id as any, { counter, lastUsedAt });
  },
});

export const renamePasskey = internalMutation({
  args: { id: v.string(), userId: v.string(), name: v.string() },
  handler: async (ctx, { id, userId, name }) => {
    const cred = (await ctx.db.get(id as any)) as any;
    if (!cred || cred.userId !== userId) throw new Error("Passkey not found");
    await ctx.db.patch(id as any, { name });
  },
});

export const deletePasskey = internalMutation({
  args: { id: v.string(), userId: v.string() },
  handler: async (ctx, { id, userId }) => {
    const cred = (await ctx.db.get(id as any)) as any;
    if (!cred || cred.userId !== userId) throw new Error("Passkey not found");
    await ctx.db.delete(id as any);
    return { ok: true };
  },
});

export const insertWebauthnChallenge = internalMutation({
  args: {
    challengeHash: v.string(),
    type: v.string(),
    email: v.optional(v.string()),
    userId: v.optional(v.string()),
    expiresInMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("webauthnChallenges", {
      challengeHash: args.challengeHash,
      type: args.type,
      email: args.email,
      userId: args.userId as any,
      expiresAt: now + args.expiresInMs,
      createdAt: now,
    });
  },
});

export const consumeWebauthnChallenge = internalMutation({
  args: { challengeHash: v.string(), type: v.string() },
  handler: async (ctx, { challengeHash, type }) => {
    const challenge = await ctx.db
      .query("webauthnChallenges")
      .withIndex("by_challengeHash", (q) => q.eq("challengeHash", challengeHash))
      .first();
    if (!challenge || challenge.type !== type) return null;
    if (challenge.expiresAt < Date.now()) {
      await ctx.db.delete(challenge._id);
      return null;
    }
    await ctx.db.delete(challenge._id); // single use
    return challenge;
  },
});

export const deleteWebauthnChallengesForUser = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const challenges = await ctx.db
      .query("webauthnChallenges")
      .filter((q) => q.eq(q.field("userId"), userId as any))
      .collect();
    for (const c of challenges) await ctx.db.delete(c._id);
  },
});

// ======================== MFA REMEMBER DEVICE ========================

export const createMfaRememberToken = internalMutation({
  args: { email: v.string(), rawToken: v.string(), expiresInMs: v.number() },
  handler: async (ctx, { email, rawToken, expiresInMs }) => {
    const now = Date.now();
    await ctx.db.insert("verificationTokens", {
      email: normalizeEmail(email),
      tokenHash: await sha256Hex(rawToken),
      type: "mfa_remember",
      expiresAt: now + expiresInMs,
      createdAt: now,
    });
    return { ok: true };
  },
});

export const clearMfaRememberTokens = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = normalizeEmail(email);
    const tokens = await ctx.db
      .query("verificationTokens")
      .withIndex("by_email_type", (q) => q.eq("email", normalized).eq("type", "mfa_remember"))
      .collect();
    for (const t of tokens) await ctx.db.delete(t._id);
    return { ok: true };
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
    return await rateLimitState(ctx, key, Date.now(), windowMs, maxAttempts);
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

// ======================== BATCHED AUTH FLOWS ========================
// These combine several fine-grained operations into a single round trip so
// the IAM handlers make far fewer Convex calls per request (the login flow
// drops from ~7 sequential calls to ~3).

export const beginLogin = internalMutation({
  args: { email: v.string(), ipAddress: v.optional(v.string()) },
  handler: async (ctx, { email, ipAddress }) => {
    const now = Date.now();
    const normalized = normalizeEmail(email);

    const maxAttemptsSetting = await ctx.runQuery(internal.settings.getInternal, { key: "maxLoginAttempts" });
    const maxAttempts = typeof maxAttemptsSetting === "number" ? maxAttemptsSetting : 5;
    const ipLimit = Math.max(maxAttempts * 4, 20);

    const rlEmail = await rateLimitState(ctx, `login:${normalized}`, now, 15 * 60 * 1000, maxAttempts);
    if (!rlEmail.allowed) return { allowed: false, lockedMinutes: 0, user: null };

    const rlIp = await rateLimitState(ctx, `login:ip:${ipAddress ?? "unknown"}`, now, 15 * 60 * 1000, ipLimit);
    if (!rlIp.allowed) return { allowed: false, lockedMinutes: 0, user: null };

    const user = await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", normalized))
      .first();

    // Progressive lockout: after repeated consecutive failures the account
    // temporarily refuses logins, with the cooldown doubling per extra failure
    // (capped at 30 minutes). Reset only by a successful login.
    if (user?.lockedUntil && user.lockedUntil > now) {
      return { allowed: false, lockedMinutes: Math.ceil((user.lockedUntil - now) / 60_000), user: null };
    }

    return { allowed: true, lockedMinutes: 0, user: user as any };
  },
});

/** Lockout policy: threshold and escalating cooldown (ms). */
export async function getLockoutThreshold(ctx: any): Promise<number> {
  const setting = await ctx.runQuery(internal.settings.getInternal, { key: "maxLoginAttempts" });
  return typeof setting === "number" ? setting : 5;
}

export function lockoutDurationMs(failedCount: number, threshold: number = 5): number {
  const over = Math.max(0, failedCount - threshold);
  return Math.min(2 ** over * 60_000, 30 * 60_000); // 2min, 4min, … cap 30min
}

export const completeLogin = internalMutation({
  args: {
    email: v.string(),
    userId: v.optional(v.string()),
    rawToken: v.optional(v.string()),
    rememberMe: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    outcome: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalized = normalizeEmail(args.email);
    const { userId, outcome } = args;
    const isSuccess = outcome === "success";

    if (isSuccess && userId && args.rawToken) {
      const tokenHash = await sha256Hex(args.rawToken);
      const absoluteMs = args.rememberMe ? SESSION_ABSOLUTE_REMEMBER_MS : SESSION_ABSOLUTE_MS;
      const sessionTimeoutSetting = await ctx.runQuery(internal.settings.getInternal, { key: "sessionTimeoutMinutes" });
      const sessionTimeoutMin = typeof sessionTimeoutSetting === "number" ? sessionTimeoutSetting : 60;
      const idleMs = sessionTimeoutMin * 60 * 1000;
      await ctx.db.insert("sessions", {
        tokenHash,
        userId: userId as any,
        createdAt: now,
        lastActiveAt: now,
        idleExpiresAt: now + idleMs,
        absoluteExpiresAt: now + absoluteMs,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        revoked: false,
      });
      const user = (await ctx.db.get(userId as any)) as any;
      if (user) {
        await ctx.db.patch(user._id, {
          lastLoginAt: now,
          loginCount: (user.loginCount ?? 0) + 1,
          // Successful login clears lockout state.
          failedLoginCount: 0,
          lockedUntil: undefined,
          updatedAt: now,
        });
      }
    } else if (!isSuccess && outcome === "invalid_credentials" && userId) {
      // Progressive lockout bookkeeping on failed credential checks.
      const user = (await ctx.db.get(userId as any)) as any;
      if (user) {
        const failedLoginCount = (user.failedLoginCount ?? 0) + 1;
        const threshold = await getLockoutThreshold(ctx);
        await ctx.db.patch(user._id, {
          failedLoginCount,
          lockedUntil: failedLoginCount >= threshold ? now + lockoutDurationMs(failedLoginCount, threshold) : user.lockedUntil,
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("loginAttempts", {
      email: normalized,
      success: isSuccess || outcome === "email_not_verified",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: now,
    });

    if (userId) {
      await ctx.db.insert("securityEvents", {
        userId: userId as any,
        action: "login",
        result: outcome,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        metadata: args.metadata,
        createdAt: now,
      });
    }

    return { ok: true };
  },
});

export const beginRegister = internalMutation({
  args: { email: v.string(), ipAddress: v.optional(v.string()) },
  handler: async (ctx, { email, ipAddress }) => {
    const now = Date.now();
    const normalized = normalizeEmail(email);

    const rl = await rateLimitState(ctx, `register:${ipAddress ?? "unknown"}`, now, 60 * 60 * 1000, 5);
    if (!rl.allowed) return { allowed: false, existing: undefined };

    const existing = await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", normalized))
      .first();
    return { allowed: true, existing: existing as any };
  },
});

export const registerUser = internalMutation({
  args: {
    email: v.string(),
    normalizedEmail: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: USER_ROLE,
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const clerkId = `tw_${randomToken(16)}`;
    const tokenIdentifier = `${process.env.CONVEX_AUTH_ISSUER ?? "https://trueworks.app"}|${clerkId}`;

    const userId = await ctx.db.insert("users", {
      clerkId,
      tokenIdentifier,
      email: args.email,
      normalizedEmail: args.normalizedEmail,
      emailVerified: false,
      passwordHash: args.passwordHash,
      name: args.name,
      role: args.role,
      status: "active",
      createdAt: now,
      updatedAt: now,
      securityVersion: 0,
      loginCount: 0,
    });

    const verifyToken = await sha256Hex(`${args.email}:email_verify:${now}:${Math.random()}`);
    const tokenHash = await sha256Hex(verifyToken);
    await ctx.db.insert("verificationTokens", {
      email: args.email,
      tokenHash,
      type: "email_verify",
      expiresAt: now + 24 * 60 * 60 * 1000,
      createdAt: now,
    });

    await ctx.db.insert("securityEvents", {
      userId,
      action: "registration",
      result: "success",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: now,
    });

    return { userId, verifyToken };
  },
});

export const beginMfa = internalMutation({
  args: {
    email: v.string(),
    userId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { email, userId, ipAddress, userAgent }) => {
    const now = Date.now();
    const mfaSessionToken = randomToken(32);
    const mfaHash = await sha256Hex(mfaSessionToken);
    await ctx.db.insert("verificationTokens", {
      email,
      tokenHash: mfaHash,
      type: "mfa_pending",
      expiresAt: now + 5 * 60 * 1000,
      createdAt: now,
    });
    await ctx.db.insert("securityEvents", {
      userId: userId as any,
      action: "login",
      result: "mfa_required",
      ipAddress,
      userAgent,
      createdAt: now,
    });
    return { mfaSessionToken };
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

export const createLoginVerification = internalMutation({
  args: {
    email: v.string(),
    userId: v.string(),
    code: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { email, userId, code, ipAddress, userAgent }) => {
    const expirySetting = await ctx.runQuery(internal.settings.getInternal, { key: "verificationCodeExpiry" });
    const expiryMin = typeof expirySetting === "number" ? expirySetting : 10;
    const codeHash = await sha256Hex(code);
    const now = Date.now();
    await ctx.db.insert("verificationTokens", {
      email,
      tokenHash: codeHash,
      type: "login_verification",
      expiresAt: now + expiryMin * 60 * 1000,
      createdAt: now,
    });
    await ctx.db.patch(userId as any, {
      lastLoginAt: now,
      updatedAt: now,
    });
    return { ok: true, ipAddress, userAgent };
  },
});

export const verifyLoginCode = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
    rememberMe: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { email, code, rememberMe, ipAddress, userAgent }) => {
    const normalized = normalizeEmail(email);
    const codeHash = await sha256Hex(code);
    const all = await ctx.db
      .query("verificationTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", codeHash))
      .collect();
    const token = all.find((t: any) => t.type === "login_verification" && !t.usedAt && t.expiresAt > Date.now() && normalizeEmail(t.email) === normalized);
    if (!token) return { ok: false as const, error: "Invalid or expired verification code." };

    await ctx.db.patch(token._id, { usedAt: Date.now() });

    const user = await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", normalized))
      .first();
    if (!user) return { ok: false as const, error: "User not found." };

    const rawToken = randomToken(32);
    const now = Date.now();
    const timeoutSetting = await ctx.runQuery(internal.settings.getInternal, { key: "sessionTimeoutMinutes" });
    const sessionTimeoutMin = typeof timeoutSetting === "number" ? timeoutSetting : 60;
    const idleMs = sessionTimeoutMin * 60 * 1000;
    const absoluteMs = rememberMe ? SESSION_ABSOLUTE_REMEMBER_MS : SESSION_ABSOLUTE_MS;
    const tokenHash = await sha256Hex(rawToken);
    await ctx.db.insert("sessions", {
      tokenHash,
      userId: user._id,
      createdAt: now,
      lastActiveAt: now,
      idleExpiresAt: now + idleMs,
      absoluteExpiresAt: now + absoluteMs,
      ipAddress,
      userAgent,
      revoked: false,
    });
    await ctx.db.patch(user._id, {
      lastLoginAt: now,
      loginCount: (user.loginCount ?? 0) + 1,
      failedLoginCount: 0,
      lockedUntil: undefined,
      updatedAt: now,
    });
    return {
      ok: true as const,
      sessionToken: rawToken,
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
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