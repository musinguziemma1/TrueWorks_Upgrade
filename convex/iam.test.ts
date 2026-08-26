/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { checkPasswordStrength, normalizeEmail, sha256Hex } from "./lib/tokens";

const modules = import.meta.glob("./**/*.ts");

async function insertTestUser(
  t: ReturnType<typeof convexTest>,
  email: string,
  overrides: Record<string, unknown> = {}
) {
  const now = Date.now();
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      clerkId: `tw_${email}`,
      tokenIdentifier: `https://trueworksgroup.com|tw_${email}`,
      email,
      normalizedEmail: normalizeEmail(email),
      emailVerified: true,
      name: "Test User",
      role: "viewer",
      status: "active",
      createdAt: now,
      updatedAt: now,
      securityVersion: 0,
      loginCount: 0,
      ...overrides,
    } as any);
  });
}

describe("IAM — password policy", () => {
  test("rejects passwords shorter than 12 characters", () => {
    expect(checkPasswordStrength("short1!pass").ok).toBe(false);
  });

  test("rejects common passwords even when long enough", () => {
    // "password1234" is in the blocklist and 12+ chars, so only the
    // common-password rule can reject it.
    expect(checkPasswordStrength("password1234").ok).toBe(false);
  });

  test("accepts a strong, unique password", () => {
    const result = checkPasswordStrength("x9$TqLm2#vR7wZd");
    expect(result.ok).toBe(true);
  });
});

describe("IAM — progressive lockout", () => {
  test("locks the account after 5 consecutive failures", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertTestUser(t, "lock@test.com");

    for (let i = 0; i < 5; i++) {
      await t.mutation(internal.iamDb.completeLogin, {
        email: "lock@test.com",
        userId,
        rememberMe: false,
        outcome: "invalid_credentials",
      });
    }

    const begin = await t.mutation(internal.iamDb.beginLogin, { email: "lock@test.com" });
    expect(begin.allowed).toBe(false);
    expect(begin.lockedMinutes).toBeGreaterThan(0);
  });

  test("a successful login clears lockout state", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertTestUser(t, "unlock@test.com");

    for (let i = 0; i < 5; i++) {
      await t.mutation(internal.iamDb.completeLogin, {
        email: "unlock@test.com",
        userId,
        rememberMe: false,
        outcome: "invalid_credentials",
      });
    }

    await t.mutation(internal.iamDb.completeLogin, {
      email: "unlock@test.com",
      userId,
      rawToken: "raw-session-token",
      rememberMe: false,
      outcome: "success",
    });

    const begin = await t.mutation(internal.iamDb.beginLogin, { email: "unlock@test.com" });
    expect(begin.allowed).toBe(true);
  });

  test("rate limits login attempts per email", async () => {
    const t = convexTest(schema, modules);
    // beginLogin counts one attempt per call; limit is 8 per 15 minutes.
    for (let i = 0; i < 8; i++) {
      await t.mutation(internal.iamDb.beginLogin, { email: "ratelimit@test.com" });
    }
    const blocked = await t.mutation(internal.iamDb.beginLogin, { email: "ratelimit@test.com" });
    expect(blocked.allowed).toBe(false);
  });
});

describe("IAM — MFA remember device", () => {
  test("creates a remember token and clears it (case-insensitive email)", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.iamDb.createMfaRememberToken, {
      email: "mfa@test.com",
      rawToken: "raw-remember-token",
      expiresInMs: 60_000,
    });

    const tokenHash = await sha256Hex("raw-remember-token");
    const stored = await t.run(async (ctx) =>
      ctx.db
        .query("verificationTokens")
        .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
        .first()
    );
    expect(stored?.type).toBe("mfa_remember");
    expect(stored?.email).toBe("mfa@test.com");

    await t.mutation(internal.iamDb.clearMfaRememberTokens, { email: "MFA@TEST.COM" });

    const remaining = await t.run(async (ctx) => ctx.db.query("verificationTokens").collect());
    expect(remaining).toHaveLength(0);
  });
});

describe("IAM — registration", () => {
  test("registerUser creates an unverified user plus a single-use verification token", async () => {
    const t = convexTest(schema, modules);
    const { userId, verifyToken } = await t.mutation(internal.iamDb.registerUser, {
      email: "new@test.com",
      normalizedEmail: "new@test.com",
      passwordHash: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
      name: "New User",
      role: "viewer",
    });
    expect(userId).toBeTruthy();
    expect(verifyToken).toBeTruthy();

    const user = (await t.run(async (ctx) => ctx.db.get(userId as any))) as any;
    expect(user?.emailVerified).toBe(false);

    const consumed = await t.mutation(internal.iamDb.consumeVerificationToken, {
      token: verifyToken,
      type: "email_verify",
    });
    expect(consumed?.email).toBe("new@test.com");

    // Token is single-use.
    const second = await t.mutation(internal.iamDb.consumeVerificationToken, {
      token: verifyToken,
      type: "email_verify",
    });
    expect(second).toBeNull();
  });
});
