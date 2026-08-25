# TrueWorks IAM — Production Configuration

This document covers the two remaining items needed so first-party authentication
and Google sign-in work in production. The JWT signing key has already been
generated and stored in the repo's `.env.local` (which is gitignored — it is
**not** committed).

---

## 1. JWT signing key (`IAM_JWT_PRIVATE_KEY`)

The IAM mints short-lived RS256 JWTs for the Convex client. The private key lives
in a Convex environment variable; the public key is served automatically via
`/.well-known/jwks.json` for Convex to validate tokens against.

> ⚠️ **Critical:** the value must contain **real newlines**, never literal `\n`
> escape sequences. A value with literal `\n` parses as a broken PEM and makes
> `/.well-known/jwks.json` and `/iam/token` fail with 500. If you copied the key
> from a one-line string, replace every `\n` with an actual line break before
> saving.

The key is a PKCS#8 PEM blob, e.g.:

```bash
IAM_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvg... (base64 body lines) ...41w==
-----END PRIVATE KEY-----"
```

**Action — set it in the Convex dashboard:**
https://dashboard.convex.dev/t/emmanuel-musinguzi/trueworks-upgrade/disciplined-clownfish-256/settings/environment-variables

1. Paste the **entire** PEM (header line, base64 body, footer line) with real
   newlines between every line.
2. Variable name: `IAM_JWT_PRIVATE_KEY`
3. Save.

**Verify:** `curl -s https://disciplined-clownfish-256.convex.site/.well-known/jwks.json`
returns a `keys` array (public side only — the private key is never exposed).
Note the `.convex.site` domain — HTTP routes are served there, not on
`.convex.cloud`.

---

## 2. Google OAuth — create an OAuth web client

1. Go to https://console.cloud.google.com/apis/credentials
2. Create/select a project and configure the **OAuth consent screen** (External):
   - App name: `TrueWorks`
   - Support email: `hello@trueworksgroup.com`
   - Authorized domains: `trueworksgroup.com`
   - Scopes: `openid email profile`
   - Add `hello@trueworksgroup.com` as a test user while in "Testing" mode
3. **Create OAuth Client ID → Web application**:
   - Authorized JavaScript origins: `https://trueworksgroup.com`
   - Authorized redirect URI: `https://trueworksgroup.com/api/auth/google/callback`

   > Google requires HTTPS. Localhost dev will not work until you add a
   > `http://localhost:3000` origin + `http://localhost:3000/api/auth/google/callback`
   > redirect (or use the production origin only and test against prod).
4. Copy the **Client ID** and **Client Secret**.

**Set both in the Convex dashboard** (same page as the JWT key):
- `GOOGLE_CLIENT_ID` = your client ID
- `GOOGLE_CLIENT_SECRET` = your client secret

(The `.env.local` placeholders `GOOGLE_CLIENT_ID=` / `GOOGLE_CLIENT_SECRET=`
exist for local reference but production reads the Convex env vars.)

### Super admin auto-promotion

Accounts whose email is listed in `SUPERADMIN_EMAILS` (comma-separated) are
created with `role: superadmin` on register, and are promoted to `superadmin`
on every password login or Google sign-in (register/login/OAuth paths). This
lets you seed admin access without manually editing the DB.

---

## 3. Cleanup — stale Clerk env vars (already removed from `.env.local`)

These are unused now and can be deleted from your Vercel/Convex project settings:

- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SIGNING_SECRET`, `CLERK_WEBHOOK_SECRET`

`@clerk/nextjs` and `svix` were removed from `package.json`; the only reference to
`CONVEX_AUTH_ISSUER` (the IAM issuer) remains and is already set.

---

## 4. Post-config verification

1. Set the three variables in the Convex dashboard: `IAM_JWT_PRIVATE_KEY`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
2. Re-deploy: `npx convex deploy`
3. Open `https://trueworksgroup.com/sign-in` → **Continue with Google** → consent →
   signed in at `/account`.
4. DevTools: no CSP errors; `GET /api/auth/me` returns your user object; Convex
   queries authenticate (no `Connection closed`).