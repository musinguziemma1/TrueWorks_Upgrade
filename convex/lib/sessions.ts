"use node";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { sha256Hex, parseUserAgent } from "./tokens";

/** Any context that can read from the database. */
type ReadCtx = QueryCtx | MutationCtx;

export type SessionDoc = Doc<"sessions">;
export type UserDoc = Doc<"users">;
export type SessionId = Id<"sessions">;

export const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 min
export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_ABSOLUTE_REMEMBER_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function getSessionByTokenHash(
  ctx: ReadCtx,
  tokenHash: string
): Promise<SessionDoc | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .first();
  return session ?? null;
}

export async function getSession(ctx: ReadCtx, sessionId: string): Promise<SessionDoc | null> {
  return await ctx.db.get(sessionId as SessionId);
}

export async function touchSession(
  ctx: MutationCtx,
  sessionId: string
): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(sessionId as SessionId, {
    lastActiveAt: now,
    idleExpiresAt: now + SESSION_IDLE_MS,
  });
}

export async function createSession(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    rawToken: string;
    rememberMe?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{ sessionId: string; rawToken: string }> {
  const tokenHash = await sha256Hex(args.rawToken);
  const now = Date.now();
  const absoluteMs = args.rememberMe
    ? SESSION_ABSOLUTE_REMEMBER_MS
    : SESSION_ABSOLUTE_MS;

  const sessionId = await ctx.db.insert("sessions", {
    tokenHash,
    userId: args.userId,
    createdAt: now,
    lastActiveAt: now,
    idleExpiresAt: now + SESSION_IDLE_MS,
    absoluteExpiresAt: now + absoluteMs,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    revoked: false,
  });

  return { sessionId: sessionId as string, rawToken: args.rawToken };
}

export async function revokeSession(
  ctx: MutationCtx,
  sessionId: string
): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(sessionId as SessionId, {
    revoked: true,
    revokedAt: now,
  });
}

export async function revokeAllSessions(
  ctx: MutationCtx,
  userId: Id<"users">,
  exceptSessionId?: string
): Promise<number> {
  const now = Date.now();
  const all = await ctx.db
    .query("sessions")
    .withIndex("by_userId_revoked", (q) =>
      q.eq("userId", userId).eq("revoked", false)
    )
    .collect();

  let count = 0;
  for (const s of all) {
    if (exceptSessionId && s._id === exceptSessionId) continue;
    await ctx.db.patch(s._id, { revoked: true, revokedAt: now });
    count++;
  }
  return count;
}

export async function listSessions(
  ctx: ReadCtx,
  userId: Id<"users">,
  includeRevoked = false
): Promise<SessionDoc[]> {
  const all = await ctx.db
    .query("sessions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();

  return all.filter((s) => includeRevoked || !s.revoked);
}

export async function validateSession(
  ctx: MutationCtx,
  rawToken: string
): Promise<{ valid: boolean; session?: SessionDoc; user?: UserDoc }> {
  const tokenHash = await sha256Hex(rawToken);
  const session = await getSessionByTokenHash(ctx, tokenHash);
  if (!session) return { valid: false };

  if (session.revoked) return { valid: false };
  if (Date.now() > session.absoluteExpiresAt) return { valid: false };
  if (Date.now() > session.idleExpiresAt) return { valid: false };

  await touchSession(ctx, session._id);

  const user = await ctx.db.get(session.userId);
  if (!user) return { valid: false };

  return { valid: true, session, user };
}

export async function createVerificationToken(
  ctx: MutationCtx,
  email: string,
  type: string,
  expiresInMs = 24 * 60 * 60 * 1000
): Promise<{ rawToken: string }> {
  const rawToken = await sha256Hex(
    `${email}:${type}:${Date.now()}:${Math.random()}`
  );
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
}

export async function consumeVerificationToken(
  ctx: MutationCtx,
  rawToken: string,
  type: string
): Promise<{ email: string } | null> {
  const tokenHash = await sha256Hex(rawToken);
  const all = await ctx.db
    .query("verificationTokens")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .collect();

  const token = all.find((t) => t.type === type && !t.usedAt && t.expiresAt > Date.now());
  if (!token) return null;

  await ctx.db.patch(token._id, { usedAt: Date.now() });
  return { email: token.email };
}

export async function recordSecurityEvent(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    action: string;
    result: string;
    actorId?: Id<"users">;
    ipAddress?: string;
    userAgent?: string;
    metadata?: unknown;
  }
): Promise<void> {
  const parsed = typeof args.userAgent === "string" ? parseUserAgent(args.userAgent) : { device: "Unknown", browser: "Unknown", os: "Unknown" };
  await ctx.db.insert("securityEvents", {
    userId: args.userId,
    actorId: args.actorId,
    action: args.action,
    result: args.result,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    city: parsed.device,
    region: undefined,
    country: undefined,
    metadata: args.metadata,
    createdAt: Date.now(),
  });
}

export async function recordLoginAttempt(
  ctx: MutationCtx,
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await ctx.db.insert("loginAttempts", {
    email,
    success,
    ipAddress,
    userAgent,
    createdAt: Date.now(),
  });
}

export async function checkRateLimit(
  ctx: MutationCtx,
  key: string,
  windowMs: number,
  maxAttempts: number
): Promise<{ allowed: boolean; remaining: number }> {
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

  await ctx.db.insert("rateLimits", {
    key,
    windowStart: now,
    count: 1,
  });
  return { allowed: true, remaining: maxAttempts - 1 };
}

export async function resetRateLimit(ctx: MutationCtx, key: string): Promise<void> {
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, { count: 0, windowStart: Date.now() });
  }
}
