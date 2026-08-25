# TRUEWORKS IAM ARCHITECTURE ASSESSMENT
## Clerk Replacement — Phase 2 Deliverable

**Date:** 2026-08-17
**Author:** Principal IAM Engineer
**Status:** Architecture Complete — Ready for Implementation

---

## 1. EXECUTIVE SUMMARY

This document describes the architecture for replacing Clerk authentication in TrueWorks
with a first-party Identity & Access Management (IAM) system, built on the existing
Next.js 16 + Convex stack.

**Key design decisions:**
- All auth state lives server-side in Convex (sessions, tokens, MFA, recovery codes)
- Passwords hashed with Argon2id via `@node-rs/argon2` in Convex Node actions
- Session tokens are 256-bit cryptographically random values; only SHA-256 hashes stored in DB
- JWT issued per-session for Convex identity propagation using RS256 with a dedicated JWKS endpoint
- HttpOnly Secure SameSite=Strict cookies for browser sessions — never localStorage
- TOTP MFA via `otplib`, recovery codes via 256-bit random values (hashed)
- RBAC enforced entirely server-side in Convex; frontend RBAC is UX-only
- All existing users (Clerk) receive a one-time "claim account" reset flow at first login

---

## 2. EXISTING SYSTEM ANALYSIS

### 2.1 Stack
| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4 | UI / routing |
| Backend | Convex (cloud deployment: disciplined-clownfish-256) | Data / logic |
| Auth | Clerk (@clerk/nextjs 7.5.22) | Identity |
| Payments | Stripe + Pesapal | Commerce |
| Email | Resend 6.18 + Convex email.ts | Transactional |
| Proxy | src/proxy.ts (clerkMiddleware) | Route guard |

### 2.2 Clerk Touchpoints (files to replace)
```
src/proxy.ts                              — clerkMiddleware / createRouteMatcher
src/app/layout.tsx                        — ClerkProvider + preconnect links
src/components/layout/providers.tsx       — ConvexProviderWithClerk + useAuth
src/components/layout/header.tsx          — useUser, UserButton
src/components/layout/mobile-nav.tsx      — useUser, useAuth().signOut
src/components/layout/cart-sync.tsx       — useUser, useAuth
src/components/layout/admin-sidebar.tsx   — useUser, useAuth
src/components/layout/admin-header.tsx    — useUser, useAuth
src/components/auth/auth-gate.tsx         — useAuth
src/components/auth/auth-layout.tsx       — useUser
src/app/sign-in/[[...sign-in]]/page.tsx   — <SignIn/>
src/app/sign-up/[[...sign-up]]/page.tsx   — <SignUp/>
src/app/(site)/account/layout.tsx         — auth() server guard
src/app/(site)/account/content.tsx        — useUser
src/app/(site)/account/account-layout-client.tsx — useUser
src/app/(site)/checkout/content.tsx       — useAuth, useUser
src/app/admin/layout.tsx                  — auth(), currentUser()
src/app/admin/page.tsx                    — useUser
src/app/admin/users/page.tsx              — useAuth
src/app/admin/profile/page.tsx            — useUser, useAuth
convex/clerk.ts                           — Clerk API actions (delete, invite, suspend)
convex/auth.config.ts                     — Convex JWT issuer domain
convex/webhooks.ts / http.ts              — Clerk webhook receiver
env                                       — 6 Clerk env vars
```

### 2.3 Existing Users Table
The current `users` table has:
- `clerkId` (string) — Clerk's user ID
- `tokenIdentifier` (string) — `${issuerDomain}|${clerkId}`
- `role` — superadmin | owner | admin | editor | viewer
- No password field (Clerk owns credentials)

**Carts and returns** are keyed by `clerkId` — this must remain stable during migration.

### 2.4 Authorization Model (current)
- `requireAdmin(ctx)` — checks admin+ role + email allowlist safety net
- `requireEditor(ctx)` — editor+ for content operations
- `requireAdminSilent(ctx)` — non-throwing boolean check
- `getCurrentUser(ctx)` — resolves by tokenIdentifier → clerkId → email
- Admin email allowlist: ADMIN_EMAILS + SUPERADMIN_EMAILS env vars

---

## 3. TARGET ARCHITECTURE

### 3.1 Component Diagram

```
Browser
  │
  │  HttpOnly cookie: tw_session=<raw token>
  │  No localStorage. No credentials in JS.
  ▼
Next.js App (Server)
  │
  ├─ proxy.ts ──────────────→ Session cookie read
  │                            → Validate session via Convex internal query
  │                            → Redirect /sign-in if missing/invalid
  │
  ├─ src/app/api/auth/
  │    /register            → Convex internal action: iam.register
  │    /login               → Convex internal action: iam.login
  │    /logout              → Revoke session in Convex
  │    /verify-email        → Validate + consume verification token
  │    /forgot-password     → Create + email reset token
  │    /reset-password      → Validate + consume reset token
  │    /mfa/setup           → Generate TOTP secret → return otpauth:// + QR
  │    /mfa/verify          → Verify TOTP code → enable MFA
  │    /mfa/challenge       → Verify MFA code at login step 2
  │    /sessions            → List/revoke sessions
  │    /token               → Issue per-session Convex JWT for React client
  │
  ├─ src/lib/auth/
  │    session.ts           — Cookie management + session DAL
  │    password.ts          — Strength validation
  │    csrf.ts              — Double-submit cookie CSRF
  │    jwt.ts               — Mint Convex JWT (RS256)
  │    provider.tsx         — AuthProvider React context
  │    hooks.ts             — useAuth, useCurrentUser, useSessions, useMFA
  │
  ▼
Convex Backend (cloud deployment)
  │
  ├─ convex/iam.ts          — Auth mutations + internal actions
  ├─ convex/lib/password.ts — Argon2id hashing (Node action)
  ├─ convex/lib/tokens.ts   — Token gen/verify helpers
  ├─ convex/lib/sessions.ts — Session CRUD + idle/absolute expiry
  ├─ convex/lib/rbac.ts     — Permission checks (Phase 5)
  │
  ├─ convex/schema.ts (extended)
  │    users                — extended with auth fields
  │    sessions             — server-session records (hashed tokens)
  │    verificationTokens   — email verification + reset + MFA pending
  │    passwordResetTokens  — (kept separate for clarity)
  │    mfaFactors           — TOTP secrets
  │    recoveryCodes        — One-time backup codes (hashed)
  │    securityEvents       — Login/MFA/role/security event log
  │    loginAttempts        — Brute-force tracking
  │
  ├─ convex/auth.config.ts  — customJwt RS256 with JWKS
  ├─ convex/http.ts         — Added /iam/.well-known/jwks.json endpoint
  └─ convex/users.ts        — Updated getCurrentUser + RBAC helpers
```

### 3.2 Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│  SESSION LIFECYCLE                                                   │
│                                                                     │
│  1. POST /api/auth/login                                            │
│     → Verify email+password in Convex (iam.login internal action)   │
│     → If MFA enabled: return { mfaRequired, mfaSessionToken }       │
│     → If OK: create session record in Convex, rotate token,         │
│       set tw_session cookie (HttpOnly Secure SameSite=Strict)       │
│                                                                     │
│  2. Browser holds cookie only. Convex holds session only.           │
│                                                                     │
│  3. GET /api/auth/token (browser, with session cookie)              │
│     → Convex revalidates session                                    │
│     → Returns short-lived RS256 JWT (5 min) for ConvexClient        │
│     → JWT carries: sub=userId, iss=issuer, role, email              │
│     → Client sets ConvexClient.setAuth(jwt)                         │
│                                                                     │
│  4. Every Convex request sends JWT in Authorization header.         │
│                                                                     │
│  5. Session rotation on: MFA completion, password change,            │
│     email change, privilege escalation.                             │
│                                                                     │
│  6. Expiry rules (server-enforced):                                 │
│     - Idle timeout:  30 min (configurable per role)                 │
│     - Absolute life:  7 days (14 with remember-me)                  │
│     - Sensitive actions: require reauth within last 10 min          │
│                                                                     │
│  7. Revocation:                                                     │
│     - Individual: revoke sessionId → next request fails             │
│     - All sessions: increment user.securityVersion                  │
│     - Password change: securityVersion++ invalidates all sessions   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Token Architecture

**Browser → Next.js:**
- Cookie: `tw_session` = raw session token (256-bit random, base64url)
- Only SHA-256 hash in DB, never raw

**Next.js → Convex (JWT):**
- RS256 signed, 5-minute TTL
- Claims: `sub` (user._id), `iss`, `aud="trueworks"`, `email`, `name`, `role`
- Convex validates via customJwt against JWKS endpoint
- `tokenIdentifier` = `${ISSUER}|${sub}` — stored in users table

**CSRF (for all cookie-authenticated mutations):**
- Double-submit cookie: `tw_csrf` (32-byte random, set alongside session cookie)
- Client includes `X-CSRF-Token: tw_csrf` header on mutations
- Server validates header matches cookie value
- SameSite=Strict prevents most CSRF; double-submit is defense-in-depth

### 3.4 Password Security

- **Algorithm:** Argon2id via `@node-rs/argon2`
- **Parameters:** time=3, memory=65536 (64MB), parallelism=4, hashLength=32
- Salt: 16-byte cryptographically random, stored with hash
- **Strength validation:**
  - Minimum 12 characters
  - Not in top-1000 most common passwords list
  - Not equal to email address
  - No arbitrary complexity rules (no mixed-case/digit/char mandates)
- **Password change:** requires reauthentication + invalidates all sessions
- **Password reset:** token valid 1 hour, single-use, invalidates all sessions

### 3.5 Registration Flow

```
POST /api/auth/register
  body: { email, password, name, firstName?, lastName? }

  1. Validate + normalize email (lowercase, trim)
  2. Check rate limit: max 5 registrations/hour per IP
  3. Check existing identity by normalizedEmail → 409 if exists
  4. Validate password strength
  5. Hash password (Argon2id) in Node action
  6. Insert user record (status=active, emailVerified=false, role=viewer)
  7. Create verification token (256-bit, expires 24h)
  8. Send verification email via existing Resend infrastructure
  9. Return { ok: true, requiresEmailVerification: true }
     (Never reveal whether email existed)
```

### 3.6 Login Flow

```
POST /api/auth/login
  body: { email, password, rememberMe?: boolean }

  1. Rate-limit check: 8 attempts/email/15min AND 20 attempts/IP/15min
  2. Look up user by normalizedEmail
  3. If not found OR password fails → generic error "Invalid credentials"
  4. Check account status (suspended → error)
  5. Check emailVerified (if not verified → return { requiresVerification })
  6. If MFA enabled → return { mfaRequired: true, mfaSessionId }
  7. Create session in Convex:
     - 256-bit random session token
     - SHA-256 hash stored in sessions table
     - Record device/IP/userAgent
     - securityVersion = user.securityVersion (for invalidation)
  8. Rotate: old session for this login is consumed
  9. Set tw_session cookie (absolute: 7d/14d, idle handled server-side)
  10. Record LOGIN_SUCCESS or LOGIN_FAILED event
  11. If new device (no prior session for this UA) → send security notification email
  12. Return { ok: true, role, email, name, mfaEnabled }
```

### 3.7 MFA Flow (TOTP)

```
Setup (authenticated):
  GET /api/auth/mfa/setup
    → Generate base32 TOTP secret (otplib)
    → Store UNVERIFIED mfaFactor in Convex
    → Return otpauth:// URI (for QR or manual entry)
    → Secret shown once, never stored in plaintext after confirmation

  POST /api/auth/mfa/verify
    body: { code }
    → Validate TOTP against unverified factor
    → Mark verified, generate 10 recovery codes
    → Return recovery codes (displayed once, stored as SHA-256 hashes)

Login step 2 (after password success):
  POST /api/auth/mfa/challenge
    body: { mfaSessionId, code } OR { mfaSessionId, recoveryCode }

    → Validate TOTP code OR unused recovery code
    → Complete login flow (issue session, set cookie)
    → If recovery code used → mark as used
    → On success → return { ok: true }
    → On failure → MFA_FAILED event, rate-limit
```

### 3.8 Session Management

All session operations authenticated (session cookie required).

```
GET /api/auth/sessions            → list active sessions (current + others)
POST /api/auth/sessions/revoke    → revoke a specific session
POST /api/auth/sessions/revoke-others → revoke all except current
POST /api/auth/sessions/revoke-all    → increment securityVersion + revoke all

Session record fields:
  - sessionId (opaque hash, not raw)
  - userId
  - device (parsed from userAgent: "Chrome on Windows")
  - ipAddress (anonymized to /24 for storage)
  - approximateLocation (country-level)
  - createdAt, lastActiveAt
  - expiresAt (absolute), idleExpiresAt
  - securityVersion
  - revoked, revokedAt
```

### 3.9 Authorization Boundaries

```
Convex functions (mutations/queries) NEVER accept userId/role from client.
getCurrentUser(ctx) always derives from ctx.auth.getUserIdentity().

Role hierarchy: superadmin > owner > admin > editor > viewer

requireAdmin     → admin+ level (existing, kept)
requireSuperAdmin→ superadmin only
requireEditor    → editor+ (existing, kept)
requirePermission(perm) → Phase 5: granular checks
requireStepUp    → reauth within last 10 min (for sensitive operations)
```

### 3.10 RBAC / Permissions (Phase 5)

Tables added in Phase 5 (not in schema.ts yet):
```
roles:            { name, description, isSystem, createdAt }
permissions:      { resource, action }  e.g. products.read, payments.refund
rolePermissions:  { roleId, permissionId }
userPermissions:  { userId, permissionId, grantedBy, grantedAt } (overrides)
organizations:    { name, slug, createdAt }  (Phase 10)
organizationMembers: { orgId, userId, role: admin|member }
```

### 3.11 Migration Strategy

**Existing Clerk users cannot have passwords migrated** (Clerk does not export password hashes).

**Approach:**
1. Keep `clerkId` field in users table (for carts/returns/order linking)
2. On first visit with new IAM: show `account-link` page requiring password reset
3. Flow: Sign in → "Your TrueWorks account needs a one-time password setup" →
   enter email → receive reset link → set new password → session established
4. `clerkId` preserved; new `passwordHash` + `normalizedEmail` + session fields added
5. Orders/downloads/licenses already linked by email — no data migration needed
6. Clerk webhook disabled once all users have migrated (monitor `passwordHash IS NULL` count)

### 3.12 Admin Impersonation

```
POST /api/auth/impersonate
  body: { targetUserId, reason } (admin+ required, reauth within 10 min)

  → Create impersonation record: { adminUserId, targetUserId, reason, startedAt }
  → Set tw_impersonation cookie (separate from session)
  → Banner in UI: "Viewing as: {targetUser.name} — Exit"
  → All actions logged to security events with adminId + targetId
  → Sensitive ops (payment config, user deletion) blocked during impersonation
  → End: POST /api/auth/impersonate/end

  Impersonation record stored in Convex with startedAt/endedAt, audit logged.
```

---

## 4. THREAT MODEL

### 4.1 Assets
- User credentials (passwords) — protected by Argon2id
- Session tokens — protected by hashing + HttpOnly
- JWT signing keys — Convex env vars only, never in frontend
- Admin sessions — elevated protection, shorter idle timeout
- Payment data — never in this system (Stripe handles)

### 4.2 Threat Actors
- Unauthenticated attacker (brute force, credential stuffing)
- Authenticated attacker (IDOR, privilege escalation)
- Compromised browser (session hijacking, XSS)
- Insider (admin impersonation abuse)

### 4.3 Attack Vectors + Mitigations

| Threat | Mitigation |
|---|---|
| Brute force / credential stuffing | Rate limiting: 8/email/15min, 20/IP/15min; account lockout after 5 failures |
| Session fixation | New session token on every login; old session rotated |
| Session hijacking (XSS) | HttpOnly cookie; no token in localStorage; CSP headers |
| CSRF | SameSite=Strict + double-submit cookie (tw_csrf) |
| JWT replay | 5-min expiry; securityVersion invalidation |
| Password reset abuse | Token single-use, 1-hour expiry, rate-limited (3/hour) |
| MFA bypass | MFA always required if enabled; no bypass via recovery code reuse |
| Privilege escalation | All role checks server-side (Convex); never trust client role |
| Email enumeration | Login always returns "Invalid credentials"; register returns generic |
| Insider abuse | Impersonation requires reason + reauth + banner + full audit |

### 4.4 Residual Risks
- **TOTP seed exposure:** If Convex DB is compromised, TOTP secrets could be extracted.
  Mitigation: mfaFactors table is only readable by superadmin+ queries.
- **JWKS private key:** Stored in Convex env. Standard practice; document in runbook.
- **No passkeys in v1:** WebAuthn not implemented but schema is extensible (mfaFactors.type field).
- **Email delivery reliability:** Resend outages will prevent verification emails.
  Monitoring: track email failures in security events.

---

## 5. DATABASE SCHEMA

Already added to `convex/schema.ts` (Phase 1). Tables:
- `users` (extended: passwordHash, normalizedEmail, emailVerified, securityVersion, mfaEnabled, lastPasswordChangeAt, lastLoginAt, deletedAt)
- `sessions` — server-session records with hashed tokens
- `verificationTokens` — email verify + reset tokens
- `passwordResetTokens` — (superseded by verificationTokens; kept for clarity)
- `mfaFactors` — TOTP secrets
- `recoveryCodes` — one-time backup codes
- `securityEvents` — login/role/security events
- `loginAttempts` — brute-force counters

**Schema additions (Phase 5 — RBAC):**
```
roles, permissions, rolePermissions, userPermissions
```
Added after core auth is proven stable.

---

## 6. CONVENTIONS

- **Naming:** camelCase in JS, snake_case only in table index names
- **No TODO/FIXME in security code** — every branch must be handled
- **Error messages:** Always generic for auth failures; log specific errors to security events
- **Audit logs:** Every auth operation logged with actor, target, result, IP, timestamp
- **Secrets:** All keys in Convex env vars (Convex dashboard) + `.env.local` (not committed)
- **Testing:** Every auth function has at least one happy-path and one failure-path test

---

## 7. IMPLEMENTATION PHASES

### Phase 3 — Core Authentication
Files:
- `convex/lib/password.ts` — Argon2id hash/verify (Node action)
- `convex/lib/tokens.ts` — Token generation, hashing, expiry
- `convex/lib/sessions.ts` — Session lifecycle
- `convex/iam.ts` — Auth functions (register, login, logout, sessions, verify, reset)
- `convex/email.ts` — Add verification + reset email templates
- `convex/http.ts` — JWKS endpoint + auth HTTP routes
- `convex/auth.config.ts` — customJwt RS256
- `src/lib/auth/session.ts` — Cookie + session DAL
- `src/lib/auth/csrf.ts` — Double-submit CSRF
- `src/lib/auth/jwt.ts` — Convex JWT minting
- `src/lib/auth/provider.tsx` — AuthProvider React context
- `src/lib/auth/hooks.ts` — useAuth, useCurrentUser, useSessions, useMFA
- `src/app/api/auth/**` — API routes

### Phase 4 — Advanced Security
- `convex/lib/mfa.ts` — TOTP + recovery codes
- `src/components/auth/mfa-*.tsx` — MFA UI components
- Rate limiting + lockout enforcement
- Security notifications (email on password change, new device)

### Phase 5 — RBAC + Permissions
- `convex/lib/rbac.ts`
- roles/permissions tables + seed
- Update all `requireAdmin` to permission-based checks

### Phase 6 — Auth UI
- Sign-in, sign-up, verify-email, forgot-password, reset-password pages
- Account security center
- Admin auth management button

### Phase 7 — Migration
- Update all 26 Clerk-referenced files
- Remove @clerk/nextjs, svix, Clerk env vars
- Update proxy.ts
- Test full login flow

---

## 8. PRODUCTION CHECKLIST

Pre-deployment verification:
- [ ] No `localStorage`/`sessionStorage` for auth tokens
- [ ] All cookies: HttpOnly, Secure, SameSite=Strict
- [ ] No plaintext passwords in DB
- [ ] Session revocation tested (immediate effect)
- [ ] Rate limiting active on: login, register, forgot-password, MFA challenge
- [ ] CSRF protection on all state-changing endpoints
- [ ] All admin operations logged to audit
- [ ] Argon2id parameters documented
- [ ] JWKS endpoint not leaking private key
- [ ] Convex customJwt verified with correct issuer
- [ ] Password reset invalidates all sessions
- [ ] Admin idle timeout: 30 min
- [ ] User idle timeout: 60 min
- [ ] Absolute session lifetime: 7 days (14 with remember-me)
- [ ] No Clerk references in source (grep verified)
- [ ] CONVEX_AUTH_* env vars set on Convex dashboard (not committed)
