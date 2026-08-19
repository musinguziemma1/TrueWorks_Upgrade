"use node";

import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { sha256Hex, parseUserAgent } from "./tokens";

export const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 min
export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_ABSOLUTE_REMEMBER_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function getSessionByTokenHash(
  ctx: any,
  tokenHash: string
): Promise<any | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q: any) => q.eq("tokenHash", tokenHash))
    .first();
  return session ?? null;
}

export async function getSession(ctx: any, sessionId: string): Promise<any | null> {
  return await ctx.db.get(sessionId);
}

export async function touchSession(
  ctx: any,
  sessionId: string
): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(sessionId, {
    lastActiveAt: now,
    idleExpiresAt: now + SESSION_IDLE_MS,
  });
}

export async function createSession(
  ctx: any,
  args: {
    userId: string;
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
    userId: args.userId as any,
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
  ctx: any,
  sessionId: string
): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(sessionId, {
    revoked: true,
    revokedAt: now,
  });
}

export async function revokeAllSessions(
  ctx: any,
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  const now = Date.now();
  const all = await ctx.db
    .query("sessions")
    .withIndex("by_userId_revoked", (q: any) =>
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
  ctx: any,
  userId: string,
  includeRevoked = false
): Promise<any[]> {
  const all = await ctx.db
    .query("sessions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .order("desc")
    .collect();

  return all.filter((s: any) => includeRevoked || !s.revoked);
}

export async function validateSession(
  ctx: any,
  rawToken: string
): Promise<{ valid: boolean; session?: any; user?: any }> {
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
  ctx: any,
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
  ctx: any,
  rawToken: string,
  type: string
): Promise<{ email: string } | null> {
  const tokenHash = await sha256Hex(rawToken);
  const all = await ctx.db
    .query("verificationTokens")
    .withIndex("by_tokenHash", (q: any) => q.eq("tokenHash", tokenHash))
    .collect();

  const token = all.find((t: any) => t.type === type && !t.usedAt && t.expiresAt > Date.now());
  if (!token) return null;

  await ctx.db.patch(token._id, { usedAt: Date.now() });
  return { email: token.email };
}

export async function recordSecurityEvent(
  ctx: any,
  args: {
    userId: string;
    action: string;
    result: string;
    actorId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }
): Promise<void> {
  const parsed = typeof args.userAgent === "string" ? parseUserAgent(args.userAgent) : { device: "Unknown", browser: "Unknown", os: "Unknown" };
  await ctx.db.insert("securityEvents", {
    userId: args.userId as any,
    actorId: args.actorId as any,
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
  ctx: any,
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
  ctx: any,
  key: string,
  windowMs: number,
  maxAttempts: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();

  if (existing && existing.windowStart > windowStart) {
    if (existing.count >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }
    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, remaining: maxAttempts - existing.count - 1 };
  }

  const id = await ctx.db.insert("rateLimits", {
    key,
    windowStart: now,
    count: 1,
  });
  return { allowed: true, remaining: maxAttempts - 1 };
}

export async function resetRateLimit(ctx: any, key: string): Promise<void> {
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, { count: 0, windowStart: Date.now() });
  }
}
