"use node";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { internal } from "./_generated/api";
import {
  isValidEmail,
  normalizeEmail,
  randomToken,
  toBase64Url,
  sha256Hex,
  parseUserAgent,
  checkPasswordStrength,
  anonymizeIp,
} from "./lib/tokens";
import {
  SESSION_ABSOLUTE_MS,
  SESSION_ABSOLUTE_REMEMBER_MS,
} from "./lib/sessions";
import {
  generateBase32Secret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTOTP,
} from "./lib/mfa";

type Ctx = any;

const CLEAR_COOKIE = "tw_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0;";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function badRequest(message: string) {
  return json({ error: message }, 400);
}
function unauthorized(message = "Unauthorized") {
  return json({ error: message }, 401);
}
function forbidden(message = "Forbidden") {
  return json({ error: message }, 403);
}
function serverError(message = "Internal server error") {
  return json({ error: message }, 500);
}

function parseJsonBody(request: Request): Promise<any> {
  return request.json().catch(() => null);
}

function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? undefined;
}

function getCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookieHeader(response: Response, value: string, maxAgeSec: number): Response {
  const cookie = `tw_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;
  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

// ======================== REGISTER ========================

export async function registerHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";

  const body = await parseJsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!isValidEmail(email)) return badRequest("Invalid email address.");
  if (!name) return badRequest("Name is required.");

  const pwCheck = checkPasswordStrength(password, email);
  if (!pwCheck.ok) return badRequest(pwCheck.reason ?? "Weak password.");

  const rl = await ctx.runMutation(internal.iamDb.checkRateLimit, {
    key: `register:${ip ?? "unknown"}`,
    windowMs: 60 * 60 * 1000,
    maxAttempts: 5,
  });
  if (!rl.allowed) return forbidden("Too many registration attempts. Please try again later.");

  const normalized = normalizeEmail(email);
  const existing = await ctx.runQuery(internal.iamDb.findUserByEmail, { email: normalized });

  if (existing) {
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: existing._id,
      action: "registration_attempt",
      result: "email_exists",
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    return badRequest("Invalid email address."); // enumeration prevention
  }

  const passwordHash = await ctx.runAction(internal.lib.password.hashPassword, { plain: password });
  const now = Date.now();
  const clerkId = `tw_${randomToken(16)}`;
  const tokenIdentifier = `${process.env.CONVEX_AUTH_ISSUER ?? "https://trueworks.app"}|${clerkId}`;

  const userId = await ctx.runMutation(internal.iamDb.insertUser, {
    clerkId,
    tokenIdentifier,
    email,
    normalizedEmail: normalized,
    emailVerified: false,
    passwordHash,
    name,
    role: "viewer",
    status: "active",
    createdAt: now,
    updatedAt: now,
    securityVersion: 0,
    loginCount: 0,
  });

  const { rawToken: verifyToken } = await ctx.runMutation(internal.iamDb.createVerificationToken, {
    email,
    type: "email_verify",
    expiresInMs: 24 * 60 * 60 * 1000,
  });

  await ctx.scheduler.runAfter(0, internal.email.sendVerificationEmail, {
    to: email,
    name,
    token: verifyToken,
  });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId,
    action: "registration",
    result: "success",
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
  });

  return json({
    ok: true,
    requiresEmailVerification: true,
  });
}

// ======================== LOGIN ========================

export async function loginHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const parsed = parseUserAgent(ua);

  const body = await parseJsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const rememberMe = !!body?.rememberMe;

  const normalized = normalizeEmail(email);

  // rate limits
  const rlEmail = await ctx.runMutation(internal.iamDb.checkRateLimit, {
    key: `login:${normalized}`,
    windowMs: 15 * 60 * 1000,
    maxAttempts: 8,
  });
  if (!rlEmail.allowed) {
    return forbidden("Too many login attempts. Please try again later.");
  }
  const rlIp = await ctx.runMutation(internal.iamDb.checkRateLimit, {
    key: `login:ip:${ip ?? "unknown"}`,
    windowMs: 15 * 60 * 1000,
    maxAttempts: 20,
  });
  if (!rlIp.allowed) {
    return forbidden("Too many login attempts from this network. Please try again later.");
  }

  const user = await ctx.runQuery(internal.iamDb.findUserByEmail, { email: normalized });

  if (!user || !user.passwordHash) {
    await ctx.runMutation(internal.iamDb.recordLoginAttempt, {
      email: normalized,
      success: false,
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    if (user?._id) {
      await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
        userId: user._id,
        action: "login",
        result: "invalid_credentials",
        ipAddress: anonymizeIp(ip),
        userAgent: ua,
        metadata: { email: normalized },
      });
    }
    return json({ error: "Invalid credentials." }, 401);
  }

  const passwordOk = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: user.passwordHash,
    plain: password,
  });
  if (!passwordOk) {
    await ctx.runMutation(internal.iamDb.recordLoginAttempt, {
      email: normalized,
      success: false,
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: user._id,
      action: "login",
      result: "invalid_credentials",
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    return json({ error: "Invalid credentials." }, 401);
  }

  if (user.status === "suspended") {
    await ctx.runMutation(internal.iamDb.recordLoginAttempt, {
      email: normalized,
      success: false,
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    return json({ error: "This account has been suspended." }, 403);
  }

  if (!user.emailVerified) {
    await ctx.runMutation(internal.iamDb.recordLoginAttempt, {
      email: normalized,
      success: true,
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    return json({ error: "Email not verified.", requiresVerification: true }, 403);
  }

  if (user.mfaEnabled) {
    const mfaRaw = randomToken(32);
    const mfaHash = await sha256Hex(mfaRaw);
    await ctx.runMutation(internal.iamDb.insertVerificationToken, {
      email: normalized,
      tokenHash: mfaHash,
      type: "mfa_pending",
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: user._id,
      action: "login",
      result: "mfa_required",
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    return json({ mfaRequired: true, mfaSessionToken: mfaRaw });
  }

  // complete login
  const rawToken = randomToken(32);
  await ctx.runMutation(internal.iamDb.createSession, {
    userId: user._id,
    rawToken,
    rememberMe,
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
  });

  await ctx.runMutation(internal.iamDb.patchDoc, {
    id: user._id,
    fields: {
      lastLoginAt: Date.now(),
      loginCount: (user.loginCount ?? 0) + 1,
      updatedAt: Date.now(),
    },
  });

  await ctx.runMutation(internal.iamDb.recordLoginAttempt, {
    email: normalized,
    success: true,
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
  });
  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: user._id,
    action: "login",
    result: "success",
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
    metadata: { device: parsed.device, browser: parsed.browser, os: parsed.os },
  });

  await ctx.scheduler.runAfter(0, internal.email.sendSecurityNotification, {
    to: user.email,
    name: user.name ?? "User",
    event: "New login",
    detail: `${parsed.device} · ${parsed.browser} · ${parsed.os}`,
  });

  return setCookieHeader(
    json({
      ok: true,
      sessionToken: rawToken,
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    }),
    rawToken,
    rememberMe ? SESSION_ABSOLUTE_REMEMBER_MS / 1000 : SESSION_ABSOLUTE_MS / 1000
  );
}

// ======================== MFA CHALLENGE ========================

export async function mfaChallengeHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await parseJsonBody(request);
  const mfaSessionToken = typeof body?.mfaSessionToken === "string" ? body.mfaSessionToken : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!mfaSessionToken || !code) return badRequest("Missing fields.");

  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";

  const mfaHash = await sha256Hex(mfaSessionToken);
  const all = await ctx.runQuery(internal.iamDb.findVerificationTokensByHash, { tokenHash: mfaHash });

  const pending = all.find((t: any) => t.type === "mfa_pending" && !t.usedAt && t.expiresAt > Date.now());
  if (!pending) return unauthorized("Invalid or expired MFA session.");

  const normalized = normalizeEmail(pending.email);
  const userRow = await ctx.runQuery(internal.iamDb.findUserByEmail, { email: normalized });

  if (!userRow) return unauthorized("Invalid MFA session.");

  const factor = await ctx.runQuery(internal.iamDb.findMfaFactorByUser, { userId: userRow._id });

  if (!factor?.verified) return unauthorized("MFA not set up.");

  // Try TOTP first
  let ok = await verifyTOTP(factor.secret, code);

  // Then recovery codes
  let usedRecovery = false;
  if (!ok) {
    const codeHash = await sha256Hex(code.toUpperCase());
    const rc = await ctx.runQuery(internal.iamDb.findRecoveryCodeByHash, { codeHash });
    if (rc && rc.userId === userRow._id && !rc.used) {
      ok = true;
      usedRecovery = true;
      await ctx.runMutation(internal.iamDb.patchDoc, { id: rc._id, fields: { used: true, usedAt: Date.now() } });
    }
  }

  if (!ok) {
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: userRow._id,
      action: "mfa_challenge",
      result: "failed",
      metadata: { attempt: code.slice(-2) },
    });
    return json({ error: "Invalid MFA code." }, 401);
  }

  await ctx.runMutation(internal.iamDb.patchDoc, { id: pending._id, fields: { usedAt: Date.now() } });

  const rawToken = randomToken(32);
  await ctx.runMutation(internal.iamDb.createSession, {
    userId: userRow._id,
    rawToken,
    rememberMe: false,
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
  });

  await ctx.runMutation(internal.iamDb.patchDoc, {
    id: userRow._id,
    fields: {
      lastLoginAt: Date.now(),
      loginCount: (userRow.loginCount ?? 0) + 1,
      updatedAt: Date.now(),
    },
  });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: userRow._id,
    action: "mfa_challenge",
    result: usedRecovery ? "recovery_code_used" : "success",
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
  });

  if (usedRecovery) {
    await ctx.scheduler.runAfter(0, internal.email.sendSecurityNotification, {
      to: userRow.email,
      name: userRow.name ?? "User",
      event: "Recovery code used",
      detail: "Consider regenerating your recovery codes.",
    });
  }

  return setCookieHeader(
    json({
      ok: true,
      sessionToken: rawToken,
      userId: userRow._id,
      role: userRow.role,
      email: userRow.email,
      name: userRow.name,
    }),
    rawToken,
    SESSION_ABSOLUTE_MS / 1000
  );
}

// ======================== LOGOUT ========================

export async function logoutHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const rawToken = getCookie(request, "tw_session");
  if (rawToken) {
    const tokenHash = await sha256Hex(rawToken);
    const session = await ctx.runQuery(internal.iamDb.findSessionByTokenHash, { tokenHash });
    if (session) {
      await ctx.runMutation(internal.iamDb.revokeSession, { id: session._id });
      await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
        userId: session.userId,
        action: "logout",
        result: "success",
        ipAddress: anonymizeIp(getClientIp(request)),
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
    }
  }
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": CLEAR_COOKIE },
  });
}

// ======================== VERIFY EMAIL ========================

export async function verifyEmailHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await parseJsonBody(request);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  const consumed = await ctx.runMutation(internal.iamDb.consumeVerificationToken, { token, type: "email_verify" });
  if (!consumed) return badRequest("Invalid or expired verification token.");

  const user = await ctx.runQuery(internal.iamDb.findUserByEmail, { email: normalizeEmail(consumed.email) });

  if (!user) return badRequest("User not found.");
  if (user.emailVerified) return json({ ok: true, alreadyVerified: true });

  await ctx.runMutation(internal.iamDb.patchDoc, { id: user._id, fields: { emailVerified: true, updatedAt: Date.now() } });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: user._id,
    action: "email_verified",
    result: "success",
  });

  await ctx.scheduler.runAfter(0, internal.email.sendIamWelcomeEmail, {
    to: user.email,
    name: user.name ?? "User",
  });

  return json({ ok: true });
}

// ======================== RESEND VERIFICATION ========================

export async function resendVerificationHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const ip = getClientIp(request);

  const rl = await ctx.runMutation(internal.iamDb.checkRateLimit, {
    key: `resend:${ip ?? "unknown"}`,
    windowMs: 60 * 60 * 1000,
    maxAttempts: 3,
  });
  if (!rl.allowed) return forbidden("Too many requests. Please try again later.");

  const body = await parseJsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) return badRequest("Invalid email.");

  const normalized = normalizeEmail(email);
  const user = await ctx.runQuery(internal.iamDb.findUserByEmail, { email: normalized });

  if (!user || user.emailVerified) return json({ ok: true }); // don't reveal

  const { rawToken } = await ctx.runMutation(internal.iamDb.createVerificationToken, {
    email: normalized,
    type: "email_verify",
    expiresInMs: 24 * 60 * 60 * 1000,
  });
  await ctx.scheduler.runAfter(0, internal.email.sendVerificationEmail, {
    to: normalized,
    name: user.name ?? "User",
    token: rawToken,
  });

  return json({ ok: true });
}

// ======================== FORGOT PASSWORD ========================

export async function forgotPasswordHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const ip = getClientIp(request);

  const rl = await ctx.runMutation(internal.iamDb.checkRateLimit, {
    key: `forgot:${ip ?? "unknown"}`,
    windowMs: 60 * 60 * 1000,
    maxAttempts: 3,
  });
  if (!rl.allowed) return forbidden("Too many requests.");

  const body = await parseJsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const normalized = normalizeEmail(email);

  const user = await ctx.runQuery(internal.iamDb.findUserByEmail, { email: normalized });

  if (user && !user.emailVerified) {
    // don't send if unverified
    return json({ ok: true });
  }

  if (user) {
    const { rawToken } = await ctx.runMutation(internal.iamDb.createVerificationToken, {
      email: normalized,
      type: "password_reset",
      expiresInMs: 60 * 60 * 1000,
    });
    await ctx.scheduler.runAfter(0, internal.email.sendPasswordResetEmail, {
      to: normalized,
      name: user.name ?? "User",
      token: rawToken,
    });
  }

  // Always return 200 to prevent enumeration
  return json({ ok: true });
}

// ======================== RESET PASSWORD ========================

export async function resetPasswordHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await parseJsonBody(request);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body?.password === "string" ? body.password : "";

  if (!token || !newPassword) return badRequest("Missing fields.");

  const pwCheck = checkPasswordStrength(newPassword);
  if (!pwCheck.ok) return badRequest(pwCheck.reason ?? "Weak password.");

  const consumed = await ctx.runMutation(internal.iamDb.consumeVerificationToken, { token, type: "password_reset" });
  if (!consumed) return badRequest("Invalid or expired reset token.");

  const normalized = normalizeEmail(consumed.email);
  const user = await ctx.runQuery(internal.iamDb.findUserByEmail, { email: normalized });

  if (!user) return badRequest("User not found.");

  const passwordHash = await ctx.runAction(internal.lib.password.hashPassword, { plain: newPassword });
  const now = Date.now();
  const newSecurityVersion = (user.securityVersion ?? 0) + 1;

  await ctx.runMutation(internal.iamDb.patchDoc, {
    id: user._id,
    fields: {
      passwordHash,
      updatedAt: now,
      lastPasswordChangeAt: now,
      securityVersion: newSecurityVersion,
    },
  });

  await ctx.runMutation(internal.iamDb.revokeAllSessions, { userId: user._id });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: user._id,
    action: "password_reset",
    result: "success",
    metadata: { newSecurityVersion },
  });

  await ctx.scheduler.runAfter(0, internal.email.sendSecurityNotification, {
    to: user.email,
    name: user.name ?? "User",
    event: "Password changed",
    detail: "Your password was reset. If you did not do this, please contact support.",
  });

  return json({ ok: true });
}

// ======================== CHANGE PASSWORD ========================

export async function changePasswordHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const body = await parseJsonBody(request);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) return badRequest("Missing fields.");

  const pwCheck = checkPasswordStrength(newPassword);
  if (!pwCheck.ok) return badRequest(pwCheck.reason ?? "Weak password.");

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const ok = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: session.user.passwordHash ?? "",
    plain: currentPassword,
  });
  if (!ok) return badRequest("Current password is incorrect.");

  const passwordHash = await ctx.runAction(internal.lib.password.hashPassword, { plain: newPassword });
  const now = Date.now();
  const newSecurityVersion = (session.user.securityVersion ?? 0) + 1;

  await ctx.runMutation(internal.iamDb.patchDoc, {
    id: session.user._id,
    fields: {
      passwordHash,
      updatedAt: now,
      lastPasswordChangeAt: now,
      securityVersion: newSecurityVersion,
    },
  });

  await ctx.runMutation(internal.iamDb.revokeAllSessions, {
    userId: session.user._id,
    exceptSessionId: session.session._id,
  });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: session.user._id,
    action: "password_changed",
    result: "success",
    ipAddress: anonymizeIp(getClientIp(request)),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  await ctx.scheduler.runAfter(0, internal.email.sendSecurityNotification, {
    to: session.user.email,
    name: session.user.name ?? "User",
    event: "Password changed",
    detail: "Your password was updated.",
  });

  return json({ ok: true });
}

// ======================== SESSIONS ========================

export async function sessionsHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "revoke") {
    const id = url.searchParams.get("id");
    if (!id) return badRequest("Missing id.");
    const target = await ctx.runQuery(internal.iamDb.getDoc, { id });
    if (!target || target.userId !== session.user._id) return json({ error: "Not found" }, 404);
    await ctx.runMutation(internal.iamDb.revokeSession, { id });
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: session.user._id,
      action: "session_revoked",
      result: "success",
      ipAddress: anonymizeIp(getClientIp(request)),
    });
    return json({ ok: true });
  }

  if (action === "revoke-others") {
    const count = await ctx.runMutation(internal.iamDb.revokeAllSessions, {
      userId: session.user._id,
      exceptSessionId: session.session._id,
    });
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: session.user._id,
      action: "all_sessions_revoked",
      result: "success",
      ipAddress: anonymizeIp(getClientIp(request)),
      metadata: { count },
    });
    return json({ ok: true, count });
  }

  if (action === "revoke-all") {
    const count = await ctx.runMutation(internal.iamDb.revokeAllSessions, { userId: session.user._id });
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: session.user._id,
      action: "all_sessions_revoked",
      result: "success",
      ipAddress: anonymizeIp(getClientIp(request)),
      metadata: { count },
    });
    return json({ ok: true, count });
  }

  const all = await ctx.runQuery(internal.iamDb.listSessionsForUser, { userId: session.user._id });
  return json({ sessions: all.map((s: any) => ({ ...s, _id: s._id })) });
}

// ======================== MFA SETUP ========================

export async function mfaSetupHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const secret = generateBase32Secret();
  await ctx.runMutation(internal.iamDb.insertMfaFactor, { userId: session.user._id, secret });

  const otpauth = `otpauth://totp/TrueWorks:${session.user.email}?secret=${secret}&issuer=TrueWorks&period=30&digits=6`;
  return json({ secret, otpauth });
}

export async function mfaEnableHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const body = await parseJsonBody(request);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const factor = await ctx.runQuery(internal.iamDb.findMfaFactorByUser, { userId: session.user._id });

  if (!factor || factor.verified) return badRequest("MFA already enabled or not started.");

  const ok = await verifyTOTP(factor.secret, code);
  if (!ok) {
    await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
      userId: session.user._id,
      action: "mfa_enable",
      result: "failed",
    });
    return json({ error: "Invalid code." }, 401);
  }

  const codes = generateRecoveryCodes(10);
  const codeHashes: string[] = [];
  for (const c of codes) codeHashes.push(await hashRecoveryCode(c));

  await ctx.runMutation(internal.iamDb.insertRecoveryCodes, { userId: session.user._id, codeHashes });
  await ctx.runMutation(internal.iamDb.patchDoc, { id: factor._id, fields: { verified: true, updatedAt: Date.now() } });
  await ctx.runMutation(internal.iamDb.patchDoc, { id: session.user._id, fields: { mfaEnabled: true, updatedAt: Date.now() } });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: session.user._id,
    action: "mfa_enabled",
    result: "success",
  });

  await ctx.scheduler.runAfter(0, internal.email.sendSecurityNotification, {
    to: session.user.email,
    name: session.user.name ?? "User",
    event: "MFA enabled",
    detail: "Multi-factor authentication is now active on your account.",
  });

  return json({ ok: true, recoveryCodes: codes });
}

export async function mfaDisableHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const body = await parseJsonBody(request);
  const password = typeof body?.password === "string" ? body.password : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const ok = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: session.user.passwordHash ?? "",
    plain: password,
  });
  if (!ok) return badRequest("Password is incorrect.");

  const factor = await ctx.runQuery(internal.iamDb.findMfaFactorByUser, { userId: session.user._id });

  if (!factor?.verified) return badRequest("MFA is not enabled.");

  const codeOk = await verifyTOTP(factor.secret, code);
  if (!codeOk) return json({ error: "Invalid MFA code." }, 401);

  await ctx.runMutation(internal.iamDb.deleteDoc, { id: factor._id });
  await ctx.runMutation(internal.iamDb.deleteRecoveryCodesForUser, { userId: session.user._id });

  await ctx.runMutation(internal.iamDb.patchDoc, { id: session.user._id, fields: { mfaEnabled: false, updatedAt: Date.now() } });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: session.user._id,
    action: "mfa_disabled",
    result: "success",
  });

  await ctx.scheduler.runAfter(0, internal.email.sendSecurityNotification, {
    to: session.user.email,
    name: session.user.name ?? "User",
    event: "MFA disabled",
    detail: "Multi-factor authentication was removed from your account.",
  });

  return json({ ok: true });
}

export async function mfaRegenerateRecoveryHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const body = await parseJsonBody(request);
  const password = typeof body?.password === "string" ? body.password : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const ok = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: session.user.passwordHash ?? "",
    plain: password,
  });
  if (!ok) return badRequest("Password is incorrect.");

  const factor = await ctx.runQuery(internal.iamDb.findMfaFactorByUser, { userId: session.user._id });

  if (!factor?.verified) return badRequest("MFA is not enabled.");

  const codeOk = await verifyTOTP(factor.secret, code);
  if (!codeOk) return json({ error: "Invalid MFA code." }, 401);

  const codes = generateRecoveryCodes(10);
  const codeHashes: string[] = [];
  for (const c of codes) codeHashes.push(await hashRecoveryCode(c));

  await ctx.runMutation(internal.iamDb.deleteRecoveryCodesForUser, { userId: session.user._id });
  await ctx.runMutation(internal.iamDb.insertRecoveryCodes, { userId: session.user._id, codeHashes });

  await ctx.runMutation(internal.iamDb.recordSecurityEvent, {
    userId: session.user._id,
    action: "recovery_codes_regenerated",
    result: "success",
  });

  return json({ ok: true, recoveryCodes: codes });
}

// ======================== GOOGLE OAUTH ========================
// "Continue with Google" for sign-up/sign-in. Flow:
//   GET  /iam/oauth/google          → 302 to Google authorize URL
//   GET  /iam/oauth/google/callback →  exchange code, find/create user,
//                                     create a session, set tw_session cookie,
//                                     redirect to /account or ?redirect=

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

function getGoogleClient(): { id: string; secret: string } | null {
  const id = process.env.GOOGLE_CLIENT_ID ?? "";
  const secret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  if (!id || !secret) return null;
  return { id, secret };
}

function getSiteOrigin(): string {
  // Trust the forwarded origin for proxied deployments; fall back to a
  // configured site URL. Never build redirect URLs from open-ended input.
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://trueworksgroup.com";
}

function encodeOauthState(value: string): string {
  return toBase64Url(new TextEncoder().encode(value));
}

function decodeOauthState(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)));
}

function invalidOauthResponse(message: string, status: 400 | 401 | 500): Response {
  return json({ error: message }, status);
}

export async function googleOauthStartHandler(ctx: Ctx, request: Request): Promise<Response> {
  const client = getGoogleClient();
  if (!client) return serverError("Google OAuth is not configured");

  const url = new URL(request.url);
  const redirectParam = url.searchParams.get("redirect") ?? "/account";
  // Only allow internal redirect targets to avoid open redirects.
  const safeRedirect = redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : "/account";

  const callbackUrl = `${getSiteOrigin()}/api/auth/google/callback`;
  const state = encodeOauthState(JSON.stringify({ redirect: safeRedirect }));

  const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authUrl.searchParams.set("client_id", client.id);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return new Response(null, { status: 302, headers: { Location: authUrl.toString() } });
}

export async function googleOauthCallbackHandler(ctx: Ctx, request: Request): Promise<Response> {
  const client = getGoogleClient();
  if (!client) return invalidOauthResponse("Google OAuth is not configured", 500);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return invalidOauthResponse("Google sign-in was cancelled or denied.", 400);
  }
  if (!code || !state) {
    return invalidOauthResponse("Google sign-in response was incomplete.", 400);
  }

  let safeRedirect: string;
  try {
    const decoded = JSON.parse(decodeOauthState(state));
    if (!decoded?.redirect || typeof decoded.redirect !== "string" || !decoded.redirect.startsWith("/") || decoded.redirect.startsWith("//")) {
      throw new Error("invalid redirect state");
    }
    safeRedirect = decoded.redirect;
  } catch {
    return invalidOauthResponse("Google sign-in session expired. Please try again.", 400);
  }

  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  let phase = "token_exchange";

  try {
    // Exchange authorization code for tokens.
    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: client.id,
        client_secret: client.secret,
        redirect_uri: `${getSiteOrigin()}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) {
      await ctx.runMutation(internal.iamDb.recordFailedLoginAttempt, { ipAddress: anonymizeIp(ip), userAgent: ua });
      console.error(`Google OAuth ${phase} failed with status ${tokenRes.status}`);
      return invalidOauthResponse("Google sign-in could not be completed. Please try again.", 401);
    }
    const token = await tokenRes.json();
    if (typeof token.access_token !== "string") {
      console.error("Google OAuth token response did not contain an access token");
      return invalidOauthResponse("Google sign-in could not be completed. Please try again.", 401);
    }

    // Fetch the user's Google profile with the access token.
    phase = "profile_fetch";
    const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userRes.ok) {
      console.error(`Google OAuth ${phase} failed with status ${userRes.status}`);
      return invalidOauthResponse("Google profile could not be loaded. Please try again.", 401);
    }
    const profile = await userRes.json();

    const email = normalizeEmail(typeof profile.email === "string" ? profile.email : "");
    if (!isValidEmail(email) || profile.email_verified === false) {
      return invalidOauthResponse("This Google account does not have a verified email address.", 400);
    }
    const name =
      [profile.given_name, profile.family_name].filter((v) => typeof v === "string" && v).join(" ") ||
      (typeof profile.name === "string" ? profile.name : "") ||
      email.split("@")[0];
    const avatar = typeof profile.picture === "string" ? profile.picture : undefined;

    const rawToken = randomToken(32);
    phase = "finalize_login";
    await ctx.runMutation(internal.iamMutations.finalizeGoogleLogin, {
      email,
      name,
      avatar,
      rawToken,
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });

    const redirectUrl = new URL(safeRedirect, getSiteOrigin());
    return setCookieHeader(
      new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      }),
      rawToken,
      SESSION_ABSOLUTE_MS / 1000
    );
  } catch (error) {
    console.error(`Google OAuth ${phase} exception`, error instanceof Error ? error.message : String(error));
    return invalidOauthResponse("Google sign-in failed. Please try again.", 500);
  }
}

// ======================== ME / CURRENT USER ========================

export async function meHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const user = { ...session.user };
  delete user.passwordHash;
  return json({ user });
}

// ======================== SECURITY EVENTS ========================

export async function securityEventsHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const events = await ctx.runQuery(internal.iamDb.listSecurityEventsForUser, { userId: session.user._id });

  return json({ events });
}

// ======================== CONVEX JWT TOKEN ========================
// Mint a short-lived RS256 JWT for the Convex client from the validated
// session. The public key is exposed via /.well-known/jwks.json and Convex
// validates the token against the customJwt issuer from auth.config.ts.

export async function tokenHandler(ctx: Ctx, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const session = await ctx.runMutation(internal.iamDb.validateSession, { rawToken });
  if (!session.valid || !session.user) return unauthorized();

  const privateKey = process.env.IAM_JWT_PRIVATE_KEY;
  if (!privateKey) return serverError("JWT signing key not configured");

  const issuer = process.env.CONVEX_AUTH_ISSUER ?? "https://trueworksgroup.com";
  const user = session.user;
  const { generateJwt } = await import("./lib/tokens");

  const jwt = await generateJwt(
    {
      sub: String(user._id),
      iss: issuer,
      aud: "trueworks",
      email: user.email,
      name: user.name ?? user.email,
      role: user.role,
    },
    privateKey,
    5 * 60
  );

  return json({ token: jwt });
}