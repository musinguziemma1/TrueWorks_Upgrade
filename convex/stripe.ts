import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const EMAIL_API_SECRET = process.env.EMAIL_API_SECRET ?? "";
const EMAIL_BASE = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

async function sendPaymentEmail(order: any, items: any[]) {
  if (!EMAIL_API_SECRET || !EMAIL_BASE) return;
  try {
    const itemList = items.map((i: any) => ({
      name: i.productName || i.name || "Product",
      quantity: i.quantity,
      price: i.price,
    }));
    await fetch(`${EMAIL_BASE}/email/download-ready`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-email-secret": EMAIL_API_SECRET,
      },
      body: JSON.stringify({
        customerEmail: order.customerEmail,
        customerName: order.customerName || "Customer",
        orderNumber: order.orderNumber,
        productName: itemList.map((i: any) => i.name).join(", "),
        downloadUrl: `${SITE_URL}/account/downloads`,
      }),
    });
  } catch (e) {
    console.error("Failed to send payment email:", e);
  }
}

async function stripePost(path: string, params?: Record<string, string>) {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(body ? {} : {}),
    },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Stripe API error ${res.status}`);
  }
  return res.json();
}

async function stripeGet(path: string) {
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Stripe API error ${res.status}`);
  }
  return res.json();
}

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<Record<string, unknown>> {
  // Parse all v1 signatures (Stripe may have multiple for key rotation)
  const v1Signatures: string[] = [];
  let timestamp = "";

  for (const part of sigHeader.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx);
    const val = part.slice(eqIdx + 1);
    if (key === "t") timestamp = val;
    if (key === "v1") v1Signatures.push(val);
  }

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Invalid stripe-signature format");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(signedPayload);

  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const computedBytes = new Uint8Array(signatureBuffer);

  // Try to verify against any of the v1 signatures
  let valid = false;
  for (const expectedSig of v1Signatures) {
    const matches = expectedSig.match(/.{1,2}/g);
    if (!matches) continue;
    const expectedBytes = new Uint8Array(matches.map((b) => parseInt(b, 16)));

    if (computedBytes.length !== expectedBytes.length) continue;

    let diff = 0;
    for (let i = 0; i < computedBytes.length; i++) {
      diff |= computedBytes[i]! ^ expectedBytes[i]!;
    }
    if (diff === 0) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    throw new Error("Invalid Stripe webhook signature");
  }

  const tolerance = 300_000;
  const eventTime = Number(timestamp) * 1000;
  if (Math.abs(Date.now() - eventTime) > tolerance) {
    throw new Error("Stripe webhook timestamp too old");
  }

  return JSON.parse(payload) as Record<string, unknown>;
}

export const createPaymentIntent = httpAction(async (ctx, req) => {
  // Rate limit: max 5 payment initiation attempts per IP per 10 minutes
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  try {
    await ctx.runMutation(internal.rateLimit.check, {
      action: "payment:initiate",
      identifier: `stripe:${ip}`,
      limit: 5,
      windowMs: 600_000,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Too many attempts. Please try again later." }), { status: 429, headers: { "Content-Type": "application/json" } });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Payment service unavailable" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const { orderId, currency, customerEmail, customerName } = body;

  if (!orderId || !customerEmail) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // SECURITY: Look up the order server-side to get the real amount.
  // Never trust client-supplied amounts.
  const order = await ctx.runQuery(api.orders.getByIdInternal, { id: orderId });
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (order.paymentStatus === "completed") {
    return new Response(JSON.stringify({ error: "Order already paid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use the order's total (in cents) — ignore any client-supplied amount
  const amountInCents = Math.round(order.total * 100);

  try {
    const params: Record<string, string> = {
      amount: String(amountInCents),
      currency: currency || "usd",
      "metadata[orderId]": orderId,
      "metadata[customerEmail]": customerEmail,
      "metadata[customerName]": customerName || order.customerName || "",
      description: `TrueWorks Order ${order.orderNumber}`,
      "receipt_email": customerEmail,
    };

    const pi = await stripePost("/payment_intents", params);

    await ctx.runMutation(internal.payments.create, {
      orderId,
      paymentId: pi.id,
      provider: "stripe",
      method: "Card",
      amount: amountInCents / 100,
      currency: currency || "usd",
      status: "pending",
      customerEmail,
      customerName: customerName || order.customerName || "",
      metadata: { clientSecret: pi.client_secret },
    });

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: pi.client_secret,
        paymentIntentId: pi.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    // SECURITY: Never leak internal error details
    return new Response(JSON.stringify({ error: "Payment creation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const handleStripeWebhook = httpAction(async (ctx, req) => {
  if (!STRIPE_WEBHOOK_SECRET) {
    return new Response("Internal error", { status: 500 });
  }

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = await verifyStripeSignature(payload, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // SECURITY: Don't leak signature verification details
    return new Response("Invalid signature", { status: 400 });
  }

  const eventId = (event.id ?? "") as string;
  if (eventId) {
    // Idempotency: Stripe retries events on delivery failures. Once processed,
    // ignore replays so downloads are never granted twice.
    const already = await ctx.runQuery(internal.webhooks.isProcessed, {
      provider: "stripe",
      eventId,
    });
    if (already) {
      return new Response("Already processed", { status: 200 });
    }
  }

  const eventType = event.type as string;
  const dataObject = event.data as { object?: Record<string, unknown> };
  const pi = dataObject?.object as Record<string, unknown> | undefined;
  if (!pi) {
    return new Response("ok", { status: 200 });
  }

  const metadata = (pi.metadata ?? {}) as Record<string, string>;

  if (eventType === "payment_intent.succeeded") {
    const orderId = metadata.orderId as Id<"orders"> | undefined;
    if (orderId) {
      // SECURITY: Verify the payment amount matches the order total
      const order = await ctx.runQuery(internal.orders.getOrderForPayment, { id: orderId });
      if (!order) {
        return new Response("Order not found", { status: 404 });
      }

      const paidAmount = (pi.amount as number) / 100;
      const expectedAmount = order.total;
      if (Math.abs(paidAmount - expectedAmount) > 0.01) {
        // Amount mismatch — possible tampering. Do NOT complete the order.
        await ctx.runMutation(internal.notifications.createPublic, {
          type: "order",
          title: "Payment Amount Mismatch",
          message: `Stripe payment for order ${orderId}: expected $${expectedAmount}, got $${paidAmount}. Order NOT completed.`,
          link: "/admin/orders",
        });
        return new Response("Amount mismatch", { status: 400 });
      }

      const payment = await ctx.runQuery(internal.payments.getByPaymentId, {
        paymentId: pi.id as string,
      });

      if (payment) {
        await ctx.runMutation(internal.payments.updateStatus, {
          id: payment._id,
          status: "completed",
          metadata: { ...payment.metadata, latestCharge: pi.latest_charge },
        });

        await ctx.runMutation(internal.orders.updateFromPayment, {
          orderId,
          paymentStatus: "completed",
          orderStatus: "processing",
          paymentId: pi.id as string,
        });

        for (const item of order.items) {
          const product = await ctx.runQuery(internal.products.getByIdInternal, {
            id: item.productId,
          });
          if (product?.downloadableFile || product?.downloadableFileStorageId) {
            const expiryDays = product.downloadExpiry ?? 30;
            await ctx.runMutation(internal.downloads.create, {
              orderId,
              productId: item.productId,
              email: order.customerEmail,
              storageId: product.downloadableFileStorageId,
              downloadCount: 0,
              remainingDownloads: product.downloadLimit ?? 10,
              expiresAt: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
              status: "active",
            });
          }
        }

        await ctx.runMutation(internal.orders.updateFromPayment, {
          orderId,
          paymentStatus: "completed",
          orderStatus: "completed",
          paymentId: pi.id as string,
        });

        await sendPaymentEmail(order, order.items);
      }

      await ctx.runMutation(internal.notifications.createPublic, {
        type: "order",
        title: "Payment Received",
        message: `Stripe payment of ${paidAmount} ${(pi.currency as string)?.toUpperCase()} completed for order ${orderId}`,
        link: "/admin/orders",
      });
    }

    if (eventId) {
      await ctx.runMutation(internal.webhooks.markProcessed, {
        provider: "stripe",
        eventId,
      });
    }
  } else if (eventType === "payment_intent.payment_failed") {
    const orderId = metadata.orderId as Id<"orders"> | undefined;
    if (orderId) {
      const payment = await ctx.runQuery(internal.payments.getByPaymentId, {
        paymentId: pi.id as string,
      });

      if (payment) {
        const lastError = (pi.last_payment_error ?? {}) as Record<string, unknown>;
        await ctx.runMutation(internal.payments.updateStatus, {
          id: payment._id,
          status: "failed",
          metadata: { ...payment.metadata, failureReason: lastError.message },
        });

        await ctx.runMutation(internal.orders.updateFromPayment, {
          orderId,
          paymentStatus: "failed",
          orderStatus: "pending",
        });

        await ctx.runMutation(internal.notifications.createPublic, {
          type: "order",
          title: "Payment Failed",
          message: `Stripe payment failed for order ${orderId}: ${(lastError.message as string) ?? "Unknown error"}`,
          link: "/admin/orders",
        });
      }

      if (eventId) {
        await ctx.runMutation(internal.webhooks.markProcessed, {
          provider: "stripe",
          eventId,
        });
      }
    }
  }

  return new Response("ok", { status: 200 });
});
