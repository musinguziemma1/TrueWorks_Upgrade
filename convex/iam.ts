"use node";

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  normalizeEmail,
  isValidEmail,
  randomToken,
  sha256Hex,
  checkPasswordStrength,
  parseUserAgent,
  anonymizeIp,
} from "./lib/tokens";
import {
  createSession,
  revokeSession,
  revokeAllSessions,
  listSessions,
  validateSession,
  createVerificationToken,
  consumeVerificationToken,
  recordSecurityEvent,
  recordLoginAttempt,
  checkRateLimit,
  resetRateLimit,
  SESSION_IDLE_MS,
  SESSION_ABSOLUTE_MS,
  SESSION_ABSOLUTE_REMEMBER_MS,
} from "./lib/sessions";
import {
  generateBase32Secret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  verifyTOTP,
} from "./lib/mfa";

type Ctx = any;

const COOKIE_OPTS = (maxAgeSec: number) =>
  `tw_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec};`;

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

  const rl = await checkRateLimit(ctx, `register:${ip ?? "unknown"}`, 60 * 60 * 1000, 5);
  if (!rl.allowed) return forbidden("Too many registration attempts. Please try again later.");

  const body = await parseJsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!isValidEmail(email)) return badRequest("Invalid email address.");
  if (!name) return badRequest("Name is required.");

  const pwCheck = checkPasswordStrength(password, email);
  if (!pwCheck.ok) return badRequest(pwCheck.reason ?? "Weak password.");

  const normalized = normalizeEmail(email);

  const existing = await ctx.db
    .query("users")
    .withIndex("by_normalizedEmail", (q: any) => q.eq("normalizedEmail", normalized))
    .first();

  if (existing) {
    await recordSecurityEvent(ctx, {
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

  const userId = await ctx.db.insert("users", {
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

  const { rawToken: verifyToken } = await createVerificationToken(ctx, email, "email_verify", 24 * 60 * 60 * 1000);

  await ctx.scheduler.runAfter(0, internal.email.sendVerificationEmail, {
    to: email,
    name,
    token: verifyToken,
  });

  await recordSecurityEvent(ctx, {
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

  // rate limits
  const rlEmail = await checkRateLimit(ctx, `login:${normalizeEmail(email)}`, 15 * 60 * 1000, 8);
  if (!rlEmail.allowed) {
    await recordSecurityEvent(ctx, {
      userId: "",
      action: "login",
      result: "rate_limited",
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
      metadata: { email },
    });
    return forbidden("Too many login attempts. Please try again later.");
  }
  const rlIp = await checkRateLimit(ctx, `login:ip:${ip ?? "unknown"}`, 15 * 60 * 1000, 20);
  if (!rlIp.allowed) {
    return forbidden("Too many login attempts from this network. Please try again later.");
  }

  const normalized = normalizeEmail(email);
  const user = await ctx.db
    .query("users")
    .withIndex("by_normalizedEmail", (q: any) => q.eq("normalizedEmail", normalized))
    .first();

  if (!user || !user.passwordHash) {
    await recordLoginAttempt(ctx, normalized, false, anonymizeIp(ip), ua);
    await recordSecurityEvent(ctx, {
      userId: user?._id ?? "",
      action: "login",
      result: "invalid_credentials",
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
      metadata: { email: normalized },
    });
    return json({ error: "Invalid credentials." }, 401);
  }

  const passwordOk = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: user.passwordHash ?? "",
    plain: password,
  });
  if (!passwordOk) {
    await recordLoginAttempt(ctx, normalized, false, anonymizeIp(ip), ua);
    await recordSecurityEvent(ctx, {
      userId: user._id,
      action: "login",
      result: "invalid_credentials",
      ipAddress: anonymizeIp(ip),
      userAgent: ua,
    });
    return json({ error: "Invalid credentials." }, 401);
  }

  if (user.status === "suspended") {
    await recordLoginAttempt(ctx, normalized, false, anonymizeIp(ip), ua);
    return json({ error: "This account has been suspended." }, 403);
  }

  if (!user.emailVerified) {
    await recordLoginAttempt(ctx, normalized, true, anonymizeIp(ip), ua);
    return json({ error: "Email not verified.", requiresVerification: true }, 403);
  }

  if (user.mfaEnabled) {
    const mfaRaw = randomToken(32);
    const mfaHash = await sha256Hex(mfaRaw);
    await ctx.db.insert("verificationTokens", {
      email: normalized,
      tokenHash: mfaHash,
      type: "mfa_pending",
      expiresAt: Date.now() + 5 * 60 * 1000,
      createdAt: Date.now(),
    });
    await recordSecurityEvent(ctx, {
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
  const { sessionId } = await createSession(ctx, {
    userId: user._id,
    rawToken,
    rememberMe,
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
  });

  await ctx.db.patch(user._id, {
    lastLoginAt: Date.now(),
    loginCount: (user.loginCount ?? 0) + 1,
    updatedAt: Date.now(),
  });

  await recordLoginAttempt(ctx, normalized, true, anonymizeIp(ip), ua);
  await recordSecurityEvent(ctx, {
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

  const mfaHash = await sha256Hex(mfaSessionToken);
  const all = await ctx.db
    .query("verificationTokens")
    .withIndex("by_tokenHash", (q: any) => q.eq("tokenHash", mfaHash))
    .collect();

  const pending = all.find((t: any) => t.type === "mfa_pending" && !t.usedAt && t.expiresAt > Date.now());
  if (!pending) return unauthorized("Invalid or expired MFA session.");

  const user = await ctx.db.get(pending.email as any);
  // Actually pending.email is user email; we need user by normalizedEmail
  const normalized = normalizeEmail(pending.email);
  const userRow = await ctx.db
    .query("users")
    .withIndex("by_normalizedEmail", (q: any) => q.eq("normalizedEmail", normalized))
    .first();

  if (!userRow) return unauthorized("Invalid MFA session.");

  const factor = await ctx.db
    .query("mfaFactors")
    .withIndex("by_userId", (q: any) => q.eq("userId", userRow._id))
    .first();

  if (!factor?.verified) return unauthorized("MFA not set up.");

  // Try TOTP first
  let ok = await verifyTOTP(factor.secret, code);

  // Then recovery codes
  let usedRecovery = false;
  if (!ok) {
    const codeHash = await sha256Hex(code.toUpperCase());
    const rc = await ctx.db
      .query("recoveryCodes")
      .withIndex("by_codeHash", (q: any) => q.eq("codeHash", codeHash))
      .first();
    if (rc && rc.userId === userRow._id && !rc.used) {
      ok = true;
      usedRecovery = true;
      await ctx.db.patch(rc._id, { used: true, usedAt: Date.now() });
    }
  }

  if (!ok) {
    await recordSecurityEvent(ctx, {
      userId: userRow._id,
      action: "mfa_challenge",
      result: "failed",
      metadata: { attempt: code.slice(-2) },
    });
    return json({ error: "Invalid MFA code." }, 401);
  }

  await ctx.db.patch(pending._id, { usedAt: Date.now() });

  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const rawToken = randomToken(32);
  const { sessionId } = await createSession(ctx, {
    userId: userRow._id,
    rawToken,
    rememberMe: false,
    ipAddress: anonymizeIp(ip),
    userAgent: ua,
  });

  await ctx.db.patch(userRow._id, {
    lastLoginAt: Date.now(),
    loginCount: (userRow.loginCount ?? 0) + 1,
    updatedAt: Date.now(),
  });

  await recordSecurityEvent(ctx, {
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
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q: any) => q.eq("tokenHash", tokenHash))
      .first();
    if (session) {
      await revokeSession(ctx, session._id);
      await recordSecurityEvent(ctx, {
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

  const result = await consumeVerificationToken(ctx, token, "email_verify");
  if (!result) return badRequest("Invalid or expired verification token.");

  const user = await ctx.db
    .query("users")
    .withIndex("by_normalizedEmail", (q: any) => q.eq("normalizedEmail", normalizeEmail(result.email)))
    .first();

  if (!user) return badRequest("User not found.");
  if (user.emailVerified) return json({ ok: true, alreadyVerified: true });

  await ctx.db.patch(user._id, { emailVerified: true, updatedAt: Date.now() });

  await recordSecurityEvent(ctx, {
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
  const rl = await checkRateLimit(ctx, `resend:${ip ?? "unknown"}`, 60 * 60 * 1000, 3);
  if (!rl.allowed) return forbidden("Too many requests. Please try again later.");

  const body = await parseJsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) return badRequest("Invalid email.");

  const normalized = normalizeEmail(email);
  const user = await ctx.db
    .query("users")
    .withIndex("by_normalizedEmail", (q: any) => q.eq("normalizedEmail", normalized))
    .first();

  if (!user || user.emailVerified) return json({ ok: true }); // don't reveal

  const { rawToken } = await createVerificationToken(ctx, normalized, "email_verify", 24 * 60 * 60 * 1000);
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
  const rl = await checkRateLimit(ctx, `forgot:${ip ?? "unknown"}`, 60 * 60 * 1000, 3);
  if (!rl.allowed) return forbidden("Too many requests.");

  const body = await parseJsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const normalized = normalizeEmail(email);

  const user = await ctx.db
    .query("users")
    .withIndex("by_normalizedEmail", (q: any) => q.eq("normalizedEmail", normalized))
    .first();

  if (user && !user.emailVerified) {
    // don't send if unverified
    return json({ ok: true });
  }

  if (user) {
    const { rawToken } = await createVerificationToken(ctx, normalized, "password_reset", 60 * 60 * 1000);
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

  const result = await consumeVerificationToken(ctx, token, "password_reset");
  if (!result) return badRequest("Invalid or expired reset token.");

  const normalized = normalizeEmail(result.email);
  const user = await ctx.db
    .query("users")
    .withIndex("by_normalizedEmail", (q: any) => q.eq("normalizedEmail", normalized))
    .first();

  if (!user) return badRequest("User not found.");

  const passwordHash = await ctx.runAction(internal.lib.password.hashPassword, { plain: newPassword });
  const now = Date.now();
  const newSecurityVersion = (user.securityVersion ?? 0) + 1;

  await ctx.db.patch(user._id, {
    passwordHash,
    updatedAt: now,
    lastPasswordChangeAt: now,
    securityVersion: newSecurityVersion,
  });

  await revokeAllSessions(ctx, user._id);

  await recordSecurityEvent(ctx, {
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

  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const body = await parseJsonBody(request);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) return badRequest("Missing fields.");

  const pwCheck = checkPasswordStrength(newPassword, session.user.email);
  if (!pwCheck.ok) return badRequest(pwCheck.reason ?? "Weak password.");

  const ok = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: session.user.passwordHash ?? "",
    plain: currentPassword,
  });
  if (!ok) return badRequest("Current password is incorrect.");

  const passwordHash = await ctx.runAction(internal.lib.password.hashPassword, { plain: newPassword });
  const now = Date.now();
  const newSecurityVersion = (session.user.securityVersion ?? 0) + 1;

  await ctx.db.patch(session.user._id, {
    passwordHash,
    updatedAt: now,
    lastPasswordChangeAt: now,
    securityVersion: newSecurityVersion,
  });

  await revokeAllSessions(ctx, session.user._id, session.session._id);

  await recordSecurityEvent(ctx, {
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

  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "revoke") {
    const id = url.searchParams.get("id");
    if (!id) return badRequest("Missing id.");
    const target = await ctx.db.get(id);
    if (!target || target.userId !== session.user._id) return json({ error: "Not found" }, 404);
    await revokeSession(ctx, id);
    await recordSecurityEvent(ctx, {
      userId: session.user._id,
      action: "session_revoked",
      result: "success",
      ipAddress: anonymizeIp(getClientIp(request)),
    });
    return json({ ok: true });
  }

  if (action === "revoke-others") {
    const count = await revokeAllSessions(ctx, session.user._id, session.session._id);
    await recordSecurityEvent(ctx, {
      userId: session.user._id,
      action: "all_sessions_revoked",
      result: "success",
      ipAddress: anonymizeIp(getClientIp(request)),
      metadata: { count },
    });
    return json({ ok: true, count });
  }

  if (action === "revoke-all") {
    const count = await revokeAllSessions(ctx, session.user._id);
    await recordSecurityEvent(ctx, {
      userId: session.user._id,
      action: "all_sessions_revoked",
      result: "success",
      ipAddress: anonymizeIp(getClientIp(request)),
      metadata: { count },
    });
    return json({ ok: true, count });
  }

  const all = await listSessions(ctx, session.user._id, true);
  return json({ sessions: all.map((s: any) => ({ ...s, _id: s._id })) });
}

// ======================== MFA SETUP ========================

export async function mfaSetupHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();
  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const secret = generateBase32Secret();
  await ctx.db.insert("mfaFactors", {
    userId: session.user._id,
    secret,
    verified: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const otpauth = `otpauth://totp/TrueWorks:${session.user.email}?secret=${secret}&issuer=TrueWorks&period=30&digits=6`;
  return json({ secret, otpauth });
}

export async function mfaEnableHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();
  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const body = await parseJsonBody(request);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const factor = await ctx.db
    .query("mfaFactors")
    .withIndex("by_userId", (q: any) => q.eq("userId", session.user._id))
    .first();

  if (!factor || factor.verified) return badRequest("MFA already enabled or not started.");

  const ok = await verifyTOTP(factor.secret, code);
  if (!ok) {
    await recordSecurityEvent(ctx, {
      userId: session.user._id,
      action: "mfa_enable",
      result: "failed",
    });
    return json({ error: "Invalid code." }, 401);
  }

  const codes = generateRecoveryCodes(10);
  const now = Date.now();
  for (const c of codes) {
    const codeHash = await hashRecoveryCode(c);
    await ctx.db.insert("recoveryCodes", {
      userId: session.user._id,
      codeHash,
      used: false,
      createdAt: now,
    });
  }

  await ctx.db.patch(factor._id, { verified: true, updatedAt: Date.now() });
  await ctx.db.patch(session.user._id, { mfaEnabled: true, updatedAt: Date.now() });

  await recordSecurityEvent(ctx, {
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
  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const body = await parseJsonBody(request);
  const password = typeof body?.password === "string" ? body.password : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const ok = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: session.user.passwordHash ?? "",
    plain: password,
  });
  if (!ok) return badRequest("Password is incorrect.");

  const factor = await ctx.db
    .query("mfaFactors")
    .withIndex("by_userId", (q: any) => q.eq("userId", session.user._id))
    .first();

  if (!factor?.verified) return badRequest("MFA is not enabled.");

  const codeOk = await verifyTOTP(factor.secret, code);
  if (!codeOk) return json({ error: "Invalid MFA code." }, 401);

  await ctx.db.delete(factor._id);
  const codes = await ctx.db
    .query("recoveryCodes")
    .withIndex("by_userId_used", (q: any) => q.eq("userId", session.user._id))
    .collect();
  for (const c of codes) await ctx.db.delete(c._id);

  await ctx.db.patch(session.user._id, { mfaEnabled: false, updatedAt: Date.now() });

  await recordSecurityEvent(ctx, {
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
  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const body = await parseJsonBody(request);
  const password = typeof body?.password === "string" ? body.password : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const ok = await ctx.runAction(internal.lib.password.verifyPassword, {
    hash: session.user.passwordHash ?? "",
    plain: password,
  });
  if (!ok) return badRequest("Password is incorrect.");

  const factor = await ctx.db
    .query("mfaFactors")
    .withIndex("by_userId", (q: any) => q.eq("userId", session.user._id))
    .first();

  if (!factor?.verified) return badRequest("MFA is not enabled.");

  const codeOk = await verifyTOTP(factor.secret, code);
  if (!codeOk) return json({ error: "Invalid MFA code." }, 401);

  const codes = generateRecoveryCodes(10);
  const now = Date.now();
  const existing = await ctx.db
    .query("recoveryCodes")
    .withIndex("by_userId_used", (q: any) => q.eq("userId", session.user._id))
    .collect();
  for (const c of existing) await ctx.db.delete(c._id);

  for (const c of codes) {
    const codeHash = await hashRecoveryCode(c);
    await ctx.db.insert("recoveryCodes", {
      userId: session.user._id,
      codeHash,
      used: false,
      createdAt: now,
    });
  }

  await recordSecurityEvent(ctx, {
    userId: session.user._id,
    action: "recovery_codes_regenerated",
    result: "success",
  });

  return json({ ok: true, recoveryCodes: codes });
}

// ======================== ME / CURRENT USER ========================

export async function meHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();

  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const { passwordHash: _, ...user } = session.user;
  return json({ user });
}

// ======================== SECURITY EVENTS ========================

export async function securityEventsHandler(ctx: Ctx, request: Request): Promise<Response> {
  const rawToken = getCookie(request, "tw_session");
  if (!rawToken) return unauthorized();
  const session = await validateSession(ctx, rawToken);
  if (!session.valid) return unauthorized();

  const events = await ctx.db
    .query("securityEvents")
    .withIndex("by_userId", (q: any) => q.eq("userId", session.user._id))
    .order("desc")
    .take(50);

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

  const session = await validateSession(ctx, rawToken);
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
