import { httpRouter } from "convex/server";
import { httpAction, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { initiatePayment, handleCallback, handleIpn } from "./pesapal";
import { createPaymentIntent, handleStripeWebhook } from "./stripe";
import { createCheckoutOrder } from "./checkout";
import {
  sendOrderConfirmation,
  sendDownloadReady,
  sendPaymentFailed,
  sendRefundConfirmation,
  handleWelcomeEmailHttp,
  sendNewsletter,
  trackOpen,
  trackClick,
} from "./email";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  mfaChallengeHandler,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  changePasswordHandler,
  sessionsHandler,
  mfaSetupHandler,
  mfaEnableHandler,
  mfaDisableHandler,
  mfaRegenerateRecoveryHandler,
  meHandler,
  securityEventsHandler,
  tokenHandler,
  googleOauthStartHandler,
  googleOauthCallbackHandler,
  passkeyRegisterOptionsHandler,
  passkeyRegisterVerifyHandler,
  passkeyAuthOptionsHandler,
  passkeyAuthVerifyHandler,
  passkeysListHandler,
  passkeyDeleteHandler,
} from "./iam";
import { generateJwks } from "./lib/tokens";

const http = httpRouter();

/**
 * Wraps an HTTP route handler with performance timing and error logging.
 * Logs slow requests (>1s) and all errors to the audit trail.
 * Handlers are plain functions; `httpAction()` is applied at route registration.
 */
type HttpHandler = (ctx: ActionCtx, request: Request) => Promise<Response>;

function withAuditTiming(handler: HttpHandler): HttpHandler {
  return async (ctx, req) => {
    const start = Date.now();
    const path = new URL(req.url).pathname;
    let response: Response;
    let error: Error | undefined;

    try {
      response = await handler(ctx, req);
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      // SECURITY: Never leak internal error messages to clients
      response = new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const latencyMs = Date.now() - start;
    const status = response.status;
    const isError = status >= 400 || !!error;
    const isSlow = latencyMs > 1000;

    if (isError || isSlow) {
      try {
        const level: "error" | "critical" | "warning" | "info" = error
          ? "error"
          : status >= 500
            ? "critical"
            : status >= 400
              ? "warning"
              : "info";
        await ctx.runMutation(api.auditLogs.log, {
          action: `http.${req.method.toLowerCase()}`,
          entityType: "http",
          entityId: path,
          summary: error
            ? `${req.method} ${path} — ${error.message}`
            : isSlow
              ? `${req.method} ${path} — ${status} (${latencyMs}ms)`
              : `${req.method} ${path} — ${status} error`,
          level,
          source: "http",
          latencyMs,
          metadata: {
            method: req.method,
            path,
            status,
            errorMessage: error?.message,
            userAgent: req.headers.get("user-agent")?.slice(0, 200),
          },
        });
      } catch {
        // Don't let audit logging failure break the request
      }
    }

    return response;
  };
}

function withIamOriginProtection(handler: HttpHandler): HttpHandler {
  return async (ctx, req) => {
    const hasSessionCookie = /(?:^|;\s*)(?:__Host-)?tw_session=/.test(req.headers.get("cookie") ?? "");
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return handler(ctx, req);
    }

    const origin = req.headers.get("origin");
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const allowedOrigins = new Set(
      [
        configuredOrigin,
        "https://trueworksgroup.com",
        "https://www.trueworksgroup.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ].filter((value): value is string => Boolean(value)),
    );

    // Cross-site state changes are always rejected. Requests without an Origin
    // header (server-to-server) are only allowed when they already carry a
    // session cookie — public POSTs (login, register, …) must prove a
    // same-origin browser context.
    if (!origin) {
      if (hasSessionCookie) return handler(ctx, req);
      return new Response(JSON.stringify({ error: "Missing Origin header" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!allowedOrigins.has(origin)) {
      return json({ error: "Invalid request origin." }, 403);
    }

    return handler(ctx, req);
  };
}

http.route({
  path: "/pesapal/initiate",
  method: "POST",
  handler: httpAction(withAuditTiming(initiatePayment)),
});

http.route({
  path: "/pesapal-callback",
  method: "GET",
  handler: httpAction(withAuditTiming(handleCallback)),
});

http.route({
  path: "/pesapal/ipn",
  method: "POST",
  handler: httpAction(withAuditTiming(handleIpn)),
});

http.route({
  path: "/checkout",
  method: "POST",
  handler: httpAction(withAuditTiming(createCheckoutOrder)),
});

http.route({
  path: "/email/order-confirmation",
  method: "POST",
  handler: httpAction(withAuditTiming(sendOrderConfirmation)),
});

http.route({
  path: "/email/download-ready",
  method: "POST",
  handler: httpAction(withAuditTiming(sendDownloadReady)),
});

http.route({
  path: "/email/payment-failed",
  method: "POST",
  handler: httpAction(withAuditTiming(sendPaymentFailed)),
});

http.route({
  path: "/email/refund",
  method: "POST",
  handler: httpAction(withAuditTiming(sendRefundConfirmation)),
});

http.route({
  path: "/email/welcome",
  method: "POST",
  handler: httpAction(withAuditTiming(handleWelcomeEmailHttp)),
});

http.route({
  path: "/email/newsletter",
  method: "POST",
  handler: httpAction(withAuditTiming(sendNewsletter)),
});

http.route({
  path: "/email/track-open",
  method: "GET",
  handler: httpAction(withAuditTiming(trackOpen)),
});

http.route({
  path: "/email/track-click",
  method: "GET",
  handler: httpAction(withAuditTiming(trackClick)),
});

http.route({
  path: "/stripe/create-payment-intent",
  method: "POST",
  handler: httpAction(withAuditTiming(createPaymentIntent)),
});

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(withAuditTiming(handleStripeWebhook)),
});

// ---------------------------------------------------------------------------
// TrueWorks IAM
// ---------------------------------------------------------------------------

http.route({
  path: "/iam/register",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(registerHandler))),
});

http.route({
  path: "/iam/login",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(loginHandler))),
});

http.route({
  path: "/iam/logout",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(logoutHandler))),
});

http.route({
  path: "/iam/mfa/challenge",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(mfaChallengeHandler))),
});

http.route({
  path: "/iam/verify-email",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(verifyEmailHandler))),
});

http.route({
  path: "/iam/resend-verification",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(resendVerificationHandler))),
});

http.route({
  path: "/iam/forgot-password",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(forgotPasswordHandler))),
});

http.route({
  path: "/iam/reset-password",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(resetPasswordHandler))),
});

http.route({
  path: "/iam/change-password",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(changePasswordHandler))),
});

http.route({
  path: "/iam/sessions",
  method: "GET",
  handler: httpAction(withAuditTiming(sessionsHandler)),
});

http.route({
  path: "/iam/sessions/revoke",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(sessionsHandler))),
});

http.route({
  path: "/iam/mfa/setup",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(mfaSetupHandler))),
});

http.route({
  path: "/iam/mfa/enable",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(mfaEnableHandler))),
});

http.route({
  path: "/iam/mfa/disable",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(mfaDisableHandler))),
});

http.route({
  path: "/iam/mfa/regenerate-recovery",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(mfaRegenerateRecoveryHandler))),
});

http.route({
  path: "/iam/me",
  method: "GET",
  handler: httpAction(withAuditTiming(meHandler)),
});

http.route({
  path: "/iam/security-events",
  method: "GET",
  handler: httpAction(withAuditTiming(securityEventsHandler)),
});

http.route({
  path: "/iam/token",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(tokenHandler))),
});

http.route({
  path: "/iam/oauth/google",
  method: "GET",
  handler: httpAction(withAuditTiming(googleOauthStartHandler)),
});

http.route({
  path: "/iam/oauth/google/callback",
  method: "GET",
  handler: httpAction(withAuditTiming(googleOauthCallbackHandler)),
});

// --------------------------- Passkeys (WebAuthn) ---------------------------

http.route({
  path: "/iam/passkeys/register/options",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(passkeyRegisterOptionsHandler))),
});

http.route({
  path: "/iam/passkeys/register/verify",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(passkeyRegisterVerifyHandler))),
});

http.route({
  path: "/iam/passkeys/auth/options",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(passkeyAuthOptionsHandler))),
});

http.route({
  path: "/iam/passkeys/auth/verify",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(passkeyAuthVerifyHandler))),
});

http.route({
  path: "/iam/passkeys",
  method: "GET",
  handler: httpAction(withAuditTiming(passkeysListHandler)),
});

http.route({
  path: "/iam/passkeys/delete",
  method: "POST",
  handler: httpAction(withAuditTiming(withIamOriginProtection(passkeyDeleteHandler))),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async (_ctx, _req) => {
    void _ctx;
    void _req;
    const privateKey = process.env.IAM_JWT_PRIVATE_KEY;
    if (!privateKey) {
      return new Response(JSON.stringify({ error: "JWKS not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      const jwks = await generateJwks(privateKey);
      return new Response(JSON.stringify(jwks), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Failed to generate JWKS" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ---------------------------------------------------------------------------
// Public reseller REST API (auth via x-api-key)
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requireApiKey(ctx: ActionCtx, req: Request): Promise<boolean> {
  const key = req.headers.get("x-api-key") ?? "";
  if (!key) return false;
  try {
    return await ctx.runMutation(internal.webhooks.validateKey, { key });
  } catch {
    return false;
  }
}

const publicCatalogQuery = async (ctx: ActionCtx, req: Request): Promise<Response> => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    if (!(await requireApiKey(ctx, req))) {
      return json({ error: "Unauthorized: missing or invalid x-api-key" }, 401);
    }
    const category = url.searchParams.get("category") ?? undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 100);
    const products = await ctx.runQuery(api.products.list, {
      category: category === "all" ? undefined : category,
    });
    const rows = (products ?? []).slice(0, limit).map((p) => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      shortDescription: p.shortDescription,
      price: p.salePrice ?? p.price,
      currency: "USD",
      thumbnail: p.thumbnail,
      rating: p.rating,
      reviewCount: p.reviewCount,
      tags: p.tags ?? [],
      updatedAt: p.updatedAt,
    }));
    return json({ count: rows.length, products: rows });
  }
  return json({ error: "Method not allowed" }, 405);
};

http.route({
  path: "/api/v1/products",
  method: "GET",
  handler: httpAction(withAuditTiming(publicCatalogQuery)),
});

export default http;
