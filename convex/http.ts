import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
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

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
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

    return new Response("ok", { status: 200 });
  }),
});

http.route({
  path: "/pesapal/initiate",
  method: "POST",
  handler: initiatePayment,
});

http.route({
  path: "/pesapal-callback",
  method: "GET",
  handler: handleCallback,
});

http.route({
  path: "/checkout",
  method: "POST",
  handler: createCheckoutOrder,
});

http.route({
  path: "/email/order-confirmation",
  method: "POST",
  handler: sendOrderConfirmation,
});

http.route({
  path: "/email/download-ready",
  method: "POST",
  handler: sendDownloadReady,
});

http.route({
  path: "/email/payment-failed",
  method: "POST",
  handler: sendPaymentFailed,
});

http.route({
  path: "/email/refund",
  method: "POST",
  handler: sendRefundConfirmation,
});

http.route({
  path: "/email/welcome",
  method: "POST",
  handler: sendWelcomeEmail,
});

http.route({
  path: "/email/newsletter",
  method: "POST",
  handler: sendNewsletter,
});

http.route({
  path: "/stripe/create-payment-intent",
  method: "POST",
  handler: createPaymentIntent,
});

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: handleStripeWebhook,
});

export default http;
