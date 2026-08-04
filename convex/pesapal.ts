import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY ?? "";
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET ?? "";
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL ?? "https://www.pesapal.com/api";
const PESAPAL_IFRAME_URL = process.env.PESAPAL_IFRAME_URL ?? "https://www.pesapal.com/iframe/PesapalIframe3";
const PESAPAL_POST_URL = process.env.PESAPAL_POST_URL ?? "https://www.pesapal.com/api/post";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const EMAIL_API_SECRET = process.env.EMAIL_API_SECRET ?? "";
const EMAIL_BASE = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

async function getPesapalToken(): Promise<string> {
  const response = await fetch(`${PESAPAL_BASE_URL}/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  return data.token;
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
    return new Response(JSON.stringify({ error: "Too many attempts. Please try again later." }), { status: 429, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  const { orderId, currency, method, customerEmail, customerName, description } = body;

  if (!orderId || !customerEmail) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  try {
    const token = await getPesapalToken();
    const order = await ctx.runQuery(internal.orders.getOrderForPayment, { id: orderId as Id<"orders"> });
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    if (order.paymentStatus === "completed") {
      return new Response(JSON.stringify({ error: "Order already paid" }), { status: 400 });
    }

    // SECURITY: Use the order's server-side total — ignore client-supplied amount
    const serverAmount = order.total;

    const callbackUrl = `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/pesapal-callback`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/order-confirmation?order=${order.orderNumber}`;

    const pesapalRequest = {
      id: order.orderNumber,
      currency: currency || "USD",
      amount: serverAmount,
      description: description || `TrueWorks Order ${order.orderNumber}`,
      callback_url: callbackUrl,
      redirect_mode: "TOP",
      cancel_url: redirectUrl,
      billing_address: {
        email_address: customerEmail,
        phone_number: order.customerName || "",
        first_name: customerName?.split(" ")[0] || "",
        last_name: customerName?.split(" ").slice(1).join(" ") || "",
        line_1: "",
        city: "",
        state: "",
        postal_code: "",
        country_code: "UG",
      },
    };

    const response = await fetch(PESAPAL_POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
        method: method || "card",
        amount: serverAmount,
        currency: currency || "USD",
        status: "pending",
        customerEmail: customerEmail,
        customerName: customerName || "",
      });

      return new Response(JSON.stringify({
        success: true,
        redirectUrl: data.redirect_url,
        orderTrackingId: data.order_tracking_id,
      }), { status: 200 });
    }

    // SECURITY: Don't leak Pesapal API details to client
    return new Response(JSON.stringify({ error: "Failed to initiate payment" }), { status: 500 });
  } catch (error) {
    // SECURITY: Don't leak internal error details
    return new Response(JSON.stringify({ error: "Payment initiation failed" }), { status: 500 });
  }
});

async function sendPaymentEmail(order: any) {
  if (!EMAIL_API_SECRET || !EMAIL_BASE) return;
  try {
    const productNames = order.items.map((i: any) => i.productName || "Product").join(", ");
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
        productName: productNames,
        downloadUrl: `${SITE_URL}/account/downloads`,
      }),
    });
  } catch (e) {
    console.error("Failed to send payment email:", e);
  }
}

export const handleCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const orderTrackingId = url.searchParams.get("order_tracking_id");
  const merchantReference = url.searchParams.get("merchant_reference");

  if (!orderTrackingId || !merchantReference) {
    return new Response("Missing parameters", { status: 400 });
  }

  try {
    const token = await getPesapalToken();
    const response = await fetch(
      `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();

    const payment = await ctx.runQuery(internal.payments.getByPaymentId, { paymentId: orderTrackingId });
    if (payment) {
      let status: "pending" | "completed" | "failed" | "refunded" = "pending";
      if (data.payment_status_description === "Completed" || data.status === "200") {
        status = "completed";
      } else if (data.payment_status_description === "Failed" || data.status === "500") {
        status = "failed";
      }

      await ctx.runMutation(internal.payments.updateStatus, {
        id: payment._id,
        status,
        metadata: data,
      });

      if (status === "completed") {
        const order = await ctx.runQuery(internal.orders.getOrderForPayment, { id: payment.orderId });
        if (order) {
          await ctx.runMutation(internal.orders.updateOrderFromPaymentById, {
            id: order._id,
            paymentStatus: "completed",
            orderStatus: "processing",
          });

          const downloadLinks = [];
          for (const item of order.items) {
            const product = await ctx.runQuery(api.products.getById, { id: item.productId });
            if (product?.downloadableFile) {
              const expiresAt = Date.now() + (product.downloadExpiry ?? 30) * 24 * 60 * 60 * 1000;
              downloadLinks.push({
                productId: item.productId,
                url: product.downloadableFile,
                expiresAt,
                downloadCount: 0,
              });

              await ctx.runMutation(internal.downloads.create, {
                productId: item.productId,
                orderId: order._id,
                email: order.customerEmail,
                downloadCount: 0,
                remainingDownloads: product.downloadLimit ?? 10,
                expiresAt,
                downloadUrl: product.downloadableFile,
                status: "active",
              });
            }
          }

          if (downloadLinks.length > 0) {
            await ctx.runMutation(internal.orders.updateOrderFromPaymentById, {
              id: order._id,
              orderStatus: "completed",
            });
            await sendPaymentEmail(order);
          }
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response("Callback processing failed", { status: 500 });
  }
});
