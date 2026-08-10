import { httpAction, internalQuery, internalMutation, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY ?? "";
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET ?? "";
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL ?? "https://pay.pesapal.com/v3/api";
const PESAPAL_TOKEN_URL = process.env.PESAPAL_TOKEN_URL ?? `${PESAPAL_BASE_URL}/Auth/RequestToken`;
const PESAPAL_SUBMIT_URL = process.env.PESAPAL_SUBMIT_URL ?? `${PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest`;
const PESAPAL_IPN_REGISTER_URL =
  process.env.PESAPAL_IPN_REGISTER_URL ?? `${PESAPAL_BASE_URL}/URLSetup/RegisterIPN`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";
const EMAIL_API_SECRET = process.env.EMAIL_API_SECRET ?? "";

const TOKEN_TTL = 4 * 60 * 1000; // Pesapal tokens are valid for ~5 minutes

/** Access-token settings keys in the shared `settings` table. */
const SETTING_TOKEN = "pesapalToken";
const SETTING_TOKEN_EXPIRY = "pesapalTokenExpiry";
const SETTING_IPN_ID = "pesapalIpnId";

export const getSetting = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();
    return rows[0]?.value ?? null;
  },
});

export const setSetting = internalMutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();
    const existing = rows[0];
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("settings", { key: args.key, value: args.value, updatedAt: Date.now() });
    }
  },
});

async function getCachedToken(ctx: ActionCtx): Promise<string | null> {
  try {
    const token = await ctx.runQuery(internal.pesapal.getSetting, { key: SETTING_TOKEN });
    const expiry = await ctx.runQuery(internal.pesapal.getSetting, { key: SETTING_TOKEN_EXPIRY });
    if (typeof token === "string" && token && typeof expiry === "number" && expiry > Date.now()) {
      return token;
    }
  } catch {
    // cache read failures are non-fatal
  }
  return null;
}

async function cacheToken(ctx: ActionCtx, token: string): Promise<void> {
  try {
    await ctx.runMutation(internal.pesapal.setSetting, { key: SETTING_TOKEN, value: token });
    await ctx.runMutation(internal.pesapal.setSetting, {
      key: SETTING_TOKEN_EXPIRY,
      value: Date.now() + TOKEN_TTL,
    });
  } catch {
    // best-effort
  }
}

async function getPesapalToken(ctx: ActionCtx): Promise<string> {
  const cached = await getCachedToken(ctx);
  if (cached) return cached;

  const response = await fetch(PESAPAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to authenticate with Pesapal");
  }
  const data = await response.json();
  if (typeof data.token !== "string" || !data.token) {
    throw new Error("Invalid Pesapal token response");
  }
  await cacheToken(ctx, data.token);
  return data.token;
}

/** Ensure the IPN URL is registered and return its notification_id. */
async function ensureIpnId(ctx: ActionCtx, token: string): Promise<string | null> {
  const cached = await ctx.runQuery(internal.pesapal.getSetting, { key: SETTING_IPN_ID });
  if (typeof cached === "string" && cached) return cached;

  const ipnUrl = process.env.PESAPAL_IPN_URL ?? `${CONVEX_SITE_URL}/pesapal/ipn`;
  if (!ipnUrl) return null;

  try {
    const response = await fetch(PESAPAL_IPN_REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "POST",
      }),
    });
    const data = await response.json();
    const ipnId: string | null = data.ipn_id ?? data.ipnId ?? null;
    if (typeof ipnId === "string" && ipnId) {
      await ctx.runMutation(internal.pesapal.setSetting, { key: SETTING_IPN_ID, value: ipnId });
      return ipnId;
    }
  } catch {
    // fall through
  }
  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const initiatePayment = httpAction(async (ctx, request) => {
  // Rate limit: max 5 payment initiation attempts per IP per 10 minutes
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  try {
    await ctx.runMutation(internal.rateLimit.check, {
      action: "payment:initiate",
      identifier: ip,
      limit: 5,
      windowMs: 600_000,
    });
  } catch {
    return json({ error: "Too many attempts. Please try again later." }, 429);
  }

  const body = await request.json().catch(() => null);
  const { orderId, currency, method, customerEmail, customerName, phone, description } =
    typeof body === "object" && body ? body : {};

  if (!orderId || !customerEmail) {
    return json({ error: "Missing required fields" }, 400);
  }

  try {
    const token = await getPesapalToken(ctx);
    const order = await ctx.runQuery(internal.orders.getOrderForPayment, {
      id: orderId as Id<"orders">,
    });
    if (!order) {
      return json({ error: "Order not found" }, 404);
    }
    if (order.paymentStatus === "completed") {
      return json({ error: "Order already paid" }, 400);
    }

    // SECURITY: server-side total — ignore client-supplied amount
    const serverAmount = order.total;

    const callbackUrl = `${CONVEX_SITE_URL}/pesapal-callback`;
    const cancelUrl = `${SITE_URL}/order-confirmation?order=${order.orderNumber}&status=pending`;

    // API 3.0 requires a registered IPN (notification_id). Register lazily.
    const ipnId = await ensureIpnId(ctx, token);
    if (!ipnId) {
      return json({ error: "Payment service not fully configured" }, 500);
    }

    const pesapalRequest: Record<string, unknown> = {
      id: order.orderNumber,
      currency: (currency as string) || "USD",
      amount: serverAmount,
      description: description || `TrueWorks Order ${order.orderNumber}`,
      callback_url: callbackUrl,
      notification_id: ipnId,
      redirect_mode: "TOP_WINDOW",
      cancellation_url: cancelUrl,
      billing_address: {
        email_address: customerEmail,
        phone_number: (phone as string) || "",
        first_name: (customerName as string)?.split(" ")[0] || "",
        last_name: (customerName as string)?.split(" ").slice(1).join(" ") || "",
        line_1: "",
        city: "",
        state: "",
        postal_code: "",
        country_code: order.country || "UG",
      },
    };

    const response = await fetch(PESAPAL_SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pesapalRequest),
    });

    const data = await response.json();

    if (data.order_tracking_id) {
      await ctx.runMutation(internal.payments.create, {
        orderId: orderId as Id<"orders">,
        paymentId: data.order_tracking_id,
        provider: "pesapal",
        method: (method as string) || "card",
        amount: serverAmount,
        currency: (currency as string) || "USD",
        status: "pending",
        customerEmail,
        customerName: customerName || "",
      });

      return json(
        {
          success: true,
          redirectUrl: data.redirect_url,
          orderTrackingId: data.order_tracking_id,
        },
        200
      );
    }

    // SECURITY: Don't leak Pesapal API details to client
    return json({ error: "Failed to initiate payment" }, 500);
  } catch {
    // SECURITY: Don't leak internal error details
    return json({ error: "Payment initiation failed" }, 500);
  }
});

interface PaymentOrder {
  _id: Id<"orders">;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  total: number;
  createdAt: number;
  items: { productId: Id<"products">; productName: string; quantity: number; price: number }[];
}

async function sendPaymentEmail(order: PaymentOrder) {
  if (!EMAIL_API_SECRET || !CONVEX_SITE_URL) return;
  try {
    const productNames = order.items.map((i) => i.productName || "Product").join(", ");
    await fetch(`${CONVEX_SITE_URL}/email/download-ready`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-email-secret": EMAIL_API_SECRET,
      },
      body: JSON.stringify({
        customerEmail: order.customerEmail,
        customerName: order.customerName || "Customer",
        orderNumber: order.orderNumber,
        productName: productNames,
        downloadUrl: `${SITE_URL}/account/downloads`,
      }),
    });
  } catch (e) {
    console.error("Failed to send payment email:", e);
  }
}

type MappedStatus = "pending" | "completed" | "failed" | "refunded";

function mapPesapalStatus(statusCode: unknown, statusDesc: unknown): MappedStatus {
  const code = Number(statusCode);
  const desc = String(statusDesc ?? "").toUpperCase();
  if (code === 1 || desc === "COMPLETED") return "completed";
  if (code === 2 || desc === "FAILED") return "failed";
  if (code === 3 || desc === "REVERSED") return "refunded";
  if (code === 0 || desc === "INVALID") return "failed";
  return "pending";
}

interface PesapalTransaction {
  status_code?: number;
  payment_status_description?: string;
  amount?: number;
  [key: string]: unknown;
}

async function queryTransactionStatus(
  ctx: ActionCtx,
  trackingId: string
): Promise<PesapalTransaction | null> {
  const token = await getPesapalToken(ctx);
  const response = await fetch(
    `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
  );
  if (!response.ok) return null;
  return await response.json();
}

/**
 * Shared processing for callback (browser redirect) and IPN (server-to-server).
 * Returns the mapped payment status so the caller can build the right response.
 *
 * Idempotency: a card payment fires BOTH the browser callback and the IPN for
 * the same orderTrackingId, and Pesapal retries failed deliveries. The order's
 * paymentStatus is the source of truth — a transaction is processed at most
 * once, replays are no-ops.
 */
async function processTransaction(ctx: ActionCtx, trackingId: string): Promise<MappedStatus> {
  const alreadyProcessed = await ctx.runQuery(internal.webhooks.isProcessed, {
    provider: "pesapal",
    eventId: trackingId,
  });

  // Resolve the live status from Pesapal.
  const data = await queryTransactionStatus(ctx, trackingId);
  if (!data) return "pending";
  const mapped = mapPesapalStatus(data.status_code, data.payment_status_description);

  const payment = await ctx.runQuery(internal.payments.getByPaymentId, {
    paymentId: trackingId,
  });
  const order = payment
    ? await ctx.runQuery(internal.orders.getOrderForPayment, { id: payment.orderId })
    : null;

  // Unknown order — nothing for us to update. Answer the ping with the mapped
  // status so callers still get the expected ack shape.
  if (!order) return mapped;

  // Already fulfilled by a prior delivery.
  if (alreadyProcessed || order.paymentStatus === "completed") return "completed";

  // Keep the payment record current but do not mark processed while pending — the
  // payment has not settled yet.
  if (payment) {
    await ctx.runMutation(internal.payments.updateStatus, {
      id: payment._id,
      status: mapped === "refunded" ? "refunded" : mapped,
      metadata: data,
    });
  }

  if (mapped !== "completed") {
    // failed / refunded / invalid payment
    await ctx.runMutation(internal.orders.updateOrderFromPaymentById, {
      id: order._id,
      paymentStatus: mapped === "refunded" ? "refunded" : "failed",
      orderStatus: "pending",
    });
    return mapped === "refunded" ? "refunded" : "failed";
  }

  if (mapped !== "completed") {
    // failed / refunded / invalid payment
    await ctx.runMutation(internal.orders.updateOrderFromPaymentById, {
      id: order._id,
      paymentStatus: mapped === "refunded" ? "refunded" : "failed",
      orderStatus: "pending",
    });
    return mapped;
  }

  // SECURITY: verify the amount matches the order total before fulfilling
  const paidAmount = Number(data.amount);
  if (Number.isFinite(paidAmount) && Math.abs(paidAmount - order.total) > 0.01) {
    await ctx.runMutation(internal.notifications.createPublic, {
      type: "order",
      title: "Payment Amount Mismatch",
      message: `Pesapal payment for order ${order.orderNumber}: expected $${order.total}, got $${paidAmount}. Order NOT completed.`,
      link: "/admin/orders",
    });
    return "completed";
  }

  await ctx.runMutation(internal.orders.updateOrderFromPaymentById, {
    id: order._id,
    paymentStatus: "completed",
    orderStatus: "processing",
    paymentId: trackingId,
  });

  for (const item of order.items) {
    const product = await ctx.runQuery(internal.products.getByIdInternal, { id: item.productId });
    if (product?.downloadableFile || product?.downloadableFileStorageId) {
      const expiresAt = Date.now() + (product.downloadExpiry ?? 30) * 24 * 60 * 60 * 1000;
      await ctx.runMutation(internal.downloads.create, {
        productId: item.productId,
        orderId: order._id,
        email: order.customerEmail,
        downloadCount: 0,
        remainingDownloads: product.downloadLimit ?? 10,
        expiresAt,
        storageId: product.downloadableFileStorageId,
        status: "active",
      });
    }
    if (product?.requiresLicense) {
      const count = product.licenseKeyCount ?? 1;
      for (let i = 0; i < count; i++) {
        await ctx.runMutation(internal.licenses.issue, {
          productId: item.productId,
          productName: product.name,
          email: order.customerEmail,
          orderId: order._id,
          maxActivations: product.activationLimit ?? 1,
        });
      }
    }
  }

  await ctx.runMutation(internal.orders.updateOrderFromPaymentById, {
    id: order._id,
    orderStatus: "completed",
  });

  await ctx.runMutation(internal.analytics.recordRevenue, {
    timestamp: order.createdAt,
    revenue: order.total ?? 0,
  });

  await ctx.runMutation(internal.notifications.createPublic, {
    type: "order",
    title: "Payment Received",
    message: `Pesapal payment of ${order.total} completed for order ${order.orderNumber}`,
    link: "/admin/orders",
  });

  await sendPaymentEmail(order);

  await ctx.runMutation(internal.webhooks.markProcessed, {
    provider: "pesapal",
    eventId: trackingId,
  });

  return "completed";
}

/** Browser redirect callback (GET). Redirects the customer to the storefront. */
export const handleCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const trackingId =
    url.searchParams.get("OrderTrackingId") || url.searchParams.get("order_tracking_id") || "";
  const merchantReference =
    url.searchParams.get("OrderMerchantReference") || url.searchParams.get("merchant_reference") || "";

  if (!trackingId || !merchantReference) {
    return json({ error: "Missing parameters" }, 400);
  }

  const mapped = await processTransaction(ctx, trackingId);

  const status = mapped === "completed" || mapped === "refunded" || mapped === "failed"
    ? mapped
    : "pending";
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${SITE_URL}/order-confirmation?order=${encodeURIComponent(merchantReference)}&status=${status}`,
    },
  });
});

/** IPN endpoint (server-to-server). Acknowledges in the JSON shape Pesapal expects. */
export const handleIpn = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [k, val] of url.searchParams) params[k] = val;

  if (request.method === "POST") {
    try {
      const body = await request.json();
      if (body && typeof body === "object") {
        const b = body as Record<string, unknown>;
        for (const [k, val] of Object.entries(b)) params[k] = String(val);
      }
    } catch {
      // non-JSON IPN postings — query params are the fallback
    }
  }

  const trackingId = params.OrderTrackingId || params.order_tracking_id || "";
  const merchantReference = params.OrderMerchantReference || params.merchant_reference || "";

  try {
    await processTransaction(ctx, trackingId);
    // Pesapal requires this exact JSON contract to stop retrying.
    return json(
      {
        orderNotificationType: "IPNCHANGE",
        orderTrackingId: trackingId,
        orderMerchantReference: merchantReference,
        status: 200,
      },
      200
    );
  } catch {
    return json(
      {
        orderNotificationType: "IPNCHANGE",
        orderTrackingId: trackingId,
        orderMerchantReference: merchantReference,
        status: 500,
      },
      500
    );
  }
});