import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { initiatePayment, handleCallback } from "./pesapal";
import { createPaymentIntent, handleStripeWebhook } from "./stripe";
import { createCheckoutOrder } from "./checkout";
import {
  sendOrderConfirmation,
  sendDownloadReady,
  sendPaymentFailed,
  sendRefundConfirmation,
  sendWelcomeEmail,
  sendNewsletter,
} from "./email";

const http = httpRouter();

/**
 * Wraps an httpAction with performance timing and error logging.
 * Logs slow requests (>1s) and all errors to the audit trail.
 */
function withAuditTiming(wrappedAction: ReturnType<typeof httpAction>) {
  return httpAction(async (ctx, req) => {
    const start = Date.now();
    const path = new URL(req.url).pathname;
    let response: Response;
    let error: Error | undefined;

    try {
      response = await (wrappedAction as any)(ctx, req);
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
        const level = error ? "error" : status >= 500 ? "critical" : status >= 400 ? "warning" : "info";
        await ctx.runMutation(api.auditLogs.log, {
          action: `http.${req.method.toLowerCase()}`,
          entityType: "http",
          entityId: path,
          summary: error
            ? `${req.method} ${path} — ${error.message}`
            : isSlow
              ? `${req.method} ${path} — ${status} (${latencyMs}ms)`
              : `${req.method} ${path} — ${status} error`,
          level: level as any,
          source: "http" as any,
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
  });
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
          level: "warning" as any,
          source: "webhook" as any,
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
        pmRole === "owner" || pmRole === "admin" || pmRole === "editor" || pmRole === "viewer" ? pmRole : undefined;

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
          level: "info" as any,
          source: "webhook" as any,
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
  handler: withAuditTiming(initiatePayment),
});

http.route({
  path: "/pesapal-callback",
  method: "GET",
  handler: withAuditTiming(handleCallback),
});

http.route({
  path: "/checkout",
  method: "POST",
  handler: withAuditTiming(createCheckoutOrder),
});

http.route({
  path: "/email/order-confirmation",
  method: "POST",
  handler: withAuditTiming(sendOrderConfirmation),
});

http.route({
  path: "/email/download-ready",
  method: "POST",
  handler: withAuditTiming(sendDownloadReady),
});

http.route({
  path: "/email/payment-failed",
  method: "POST",
  handler: withAuditTiming(sendPaymentFailed),
});

http.route({
  path: "/email/refund",
  method: "POST",
  handler: withAuditTiming(sendRefundConfirmation),
});

http.route({
  path: "/email/welcome",
  method: "POST",
  handler: withAuditTiming(sendWelcomeEmail),
});

http.route({
  path: "/email/newsletter",
  method: "POST",
  handler: withAuditTiming(sendNewsletter),
});

http.route({
  path: "/stripe/create-payment-intent",
  method: "POST",
  handler: withAuditTiming(createPaymentIntent),
});

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: withAuditTiming(handleStripeWebhook),
});

export default http;
