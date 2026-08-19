import { httpRouter } from "convex/server";
import { httpAction, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";
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

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const start = Date.now();
    const secret = [
      process.env.CLERK_WEBHOOK_SIGNING_SECRET,
      process.env.CLERK_WEBHOOK_SECRET,
    ].find((value): value is string => Boolean(value?.trim()));

    if (!secret) {
      return new Response("Internal error", { status: 500 });
    }

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await req.text();
    const wh = new Webhook(secret);
    let evt: { type?: unknown; data?: unknown };
    try {
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as { type?: unknown; data?: unknown };
    } catch {
      const latencyMs = Date.now() - start;
      try {
        await ctx.runMutation(api.auditLogs.log, {
          action: "http.post",
          entityType: "http",
          entityId: "/clerk-webhook",
          summary: "POST /clerk-webhook — Invalid signature",
          level: "warning",
          source: "webhook",
          latencyMs,
        });
      } catch {}
      return new Response("Invalid signature", { status: 400 });
    }

    const type = typeof evt.type === "string" ? evt.type : "";
    const data = (evt.data ?? {}) as {
      id?: unknown;
      primary_email_address_id?: unknown;
      email_addresses?: unknown;
      first_name?: unknown;
      last_name?: unknown;
      username?: unknown;
      image_url?: unknown;
      profile_image_url?: unknown;
      public_metadata?: unknown;
    };

    if (typeof data.id !== "string") {
      return new Response("Bad payload", { status: 400 });
    }

    const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN ?? "";
    const tokenIdentifier = `${issuerDomain}|${data.id}`;

    if (type === "user.created" || type === "user.updated") {
      const addresses = Array.isArray(data.email_addresses)
        ? (data.email_addresses as Array<{ id?: string; email_address?: string }>)
        : [];
      const primaryId =
        typeof data.primary_email_address_id === "string"
          ? data.primary_email_address_id
          : undefined;
      const primary =
        addresses.find((a) => a.id === primaryId) ?? addresses[0];
      const email = primary?.email_address ?? "";

      const first = typeof data.first_name === "string" ? data.first_name : "";
      const last = typeof data.last_name === "string" ? data.last_name : "";
      const username =
        typeof data.username === "string" ? data.username : undefined;
      const name =
        [first, last].filter(Boolean).join(" ") || username || undefined;

      const avatar =
        (typeof data.image_url === "string" && data.image_url) ||
        (typeof data.profile_image_url === "string" && data.profile_image_url) ||
        undefined;

      const pmRole =
        data.public_metadata &&
        typeof data.public_metadata === "object" &&
        (data.public_metadata as { role?: unknown }).role;
      const publicRole =
        pmRole === "owner" || pmRole === "admin" || pmRole === "editor" || pmRole === "viewer" || pmRole === "superadmin" ? pmRole : undefined;

      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: data.id,
        tokenIdentifier,
        email,
        name,
        avatar,
        publicRole,
      });
    } else if (type === "user.deleted") {
      await ctx.runMutation(internal.users.deleteFromClerk, {
        clerkId: data.id,
      });
    }

    const latencyMs = Date.now() - start;
    if (latencyMs > 1000) {
      try {
        await ctx.runMutation(api.auditLogs.log, {
          action: "http.post",
          entityType: "http",
          entityId: "/clerk-webhook",
          summary: `POST /clerk-webhook — ${type} (${latencyMs}ms)`,
          level: "info",
          source: "webhook",
          latencyMs,
          metadata: { clerkEvent: type },
        });
      } catch {}
    }

    return new Response("ok", { status: 200 });
  }),
});

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
  handler: httpAction(withAuditTiming(registerHandler)),
});

http.route({
  path: "/iam/login",
  method: "POST",
  handler: httpAction(withAuditTiming(loginHandler)),
});

http.route({
  path: "/iam/logout",
  method: "POST",
  handler: httpAction(withAuditTiming(logoutHandler)),
});

http.route({
  path: "/iam/mfa/challenge",
  method: "POST",
  handler: httpAction(withAuditTiming(mfaChallengeHandler)),
});

http.route({
  path: "/iam/verify-email",
  method: "POST",
  handler: httpAction(withAuditTiming(verifyEmailHandler)),
});

http.route({
  path: "/iam/resend-verification",
  method: "POST",
  handler: httpAction(withAuditTiming(resendVerificationHandler)),
});

http.route({
  path: "/iam/forgot-password",
  method: "POST",
  handler: httpAction(withAuditTiming(forgotPasswordHandler)),
});

http.route({
  path: "/iam/reset-password",
  method: "POST",
  handler: httpAction(withAuditTiming(resetPasswordHandler)),
});

http.route({
  path: "/iam/change-password",
  method: "POST",
  handler: httpAction(withAuditTiming(changePasswordHandler)),
});

http.route({
  path: "/iam/sessions",
  method: "GET",
  handler: httpAction(withAuditTiming(sessionsHandler)),
});

http.route({
  path: "/iam/sessions/revoke",
  method: "POST",
  handler: httpAction(withAuditTiming(sessionsHandler)),
});

http.route({
  path: "/iam/mfa/setup",
  method: "POST",
  handler: httpAction(withAuditTiming(mfaSetupHandler)),
});

http.route({
  path: "/iam/mfa/enable",
  method: "POST",
  handler: httpAction(withAuditTiming(mfaEnableHandler)),
});

http.route({
  path: "/iam/mfa/disable",
  method: "POST",
  handler: httpAction(withAuditTiming(mfaDisableHandler)),
});

http.route({
  path: "/iam/mfa/regenerate-recovery",
  method: "POST",
  handler: httpAction(withAuditTiming(mfaRegenerateRecoveryHandler)),
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
  handler: httpAction(withAuditTiming(tokenHandler)),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async (_ctx, _req) => {
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
