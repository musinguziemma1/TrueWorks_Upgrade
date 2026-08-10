import { internalAction, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY ?? "";
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET ?? "";
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL ?? "https://pay.pesapal.com/v3/api";
const PESAPAL_TOKEN_URL =
  process.env.PESAPAL_TOKEN_URL ?? `${PESAPAL_BASE_URL}/Auth/RequestToken`;
const PESAPAL_REFUND_URL =
  process.env.PESAPAL_REFUND_URL ?? `${PESAPAL_BASE_URL}/Transactions/RefundRequest`;
const PESAPAL_STATUS_URL = `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus`;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

const SETTING_TOKEN = "pesapalToken";
const SETTING_TOKEN_EXPIRY = "pesapalTokenExpiry";

type ProviderRefundResult = { ok: boolean; provider: string; error?: string };

type ExecuteRefundResult = {
  ok: boolean;
  reason?: string;
  providerResult?: ProviderRefundResult;
};

/**
 * Executes an approved refund: reverses the payment at the provider (where
 * supported), revokes downloads/licenses, rolls back sales/customer/coupon
 * stats, and emails the customer. Scheduled by `returns.review` on approval.
 */
export const executeRefund = internalAction({
  args: { returnId: v.id("returns"), adminName: v.string() },
  handler: async (ctx, args): Promise<ExecuteRefundResult> => {
    const ret = await ctx.runQuery(internal.returnsInternal.getByIdInternal, { id: args.returnId });
    if (!ret) return { ok: false, reason: "return_not_found" };
    if (ret.status !== "approved" && ret.status !== "pending") {
      return { ok: false, reason: `status_${ret.status}` };
    }

    const order = await ctx.runQuery(internal.orders.getOrderForPayment, { id: ret.orderId });
    if (!order) return { ok: false, reason: "order_not_found" };

    if (order.paymentStatus === "refunded") {
      await ctx.runMutation(internal.returnsInternal.markCompleted, {
        id: ret._id,
        refundedAt: Date.now(),
        providerResult: "already_refunded",
      });
      return { ok: true };
    }

    // 1) Best-effort provider reversal. Failures are surfaced to admins, never
    //    silently dropped.
    const providerResult = await requestProviderRefund(ctx, order, args.adminName);

    // 2) In-system reversal — this is what actually removes access.
    await ctx.runMutation(internal.fulfillment.adjustSales, {
      items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      delta: -1,
    });
    await ctx.runMutation(internal.fulfillment.adjustCustomerStats, {
      email: order.customerEmail,
      amount: order.total,
      delta: -1,
    });
    if (order.couponCode) {
      await ctx.runMutation(internal.fulfillment.adjustCouponUsage, {
        code: order.couponCode,
        delta: -1,
      });
    }
    await ctx.runMutation(internal.fulfillment.revokeFulfillment, { orderId: order._id });
    await ctx.runMutation(internal.orders.updateOrderFromPaymentById, {
      id: order._id,
      paymentStatus: "refunded",
      orderStatus: "pending",
    });

    const payments = await ctx.runQuery(internal.payments.getByOrderIdInternal, {
      orderId: order._id,
    });
    for (const p of payments) {
      await ctx.runMutation(internal.payments.updateStatus, {
        id: p._id,
        status: "refunded",
        metadata: { ...p.metadata, refundedAt: Date.now(), refundMethod: "admin-approved" },
      });
    }

    await ctx.runMutation(internal.returnsInternal.markCompleted, {
      id: ret._id,
      refundedAt: Date.now(),
      providerResult: providerResult.ok
        ? providerResult.provider === "unknown"
          ? "in_system"
          : "provider_refund_requested"
        : `manual:${providerResult.error}`,
    });

    // 3) Customer email + admin notification.
    const reason = ret.items[0]?.reason;
    await ctx.runAction(internal.email.sendRefundEmail, {
      to: order.customerEmail,
      customerName: order.customerName || "Customer",
      orderNumber: order.orderNumber,
      amount: order.total,
      reason,
      type: "processed",
    });

    if (!providerResult.ok) {
      await ctx.runMutation(internal.notifications.createPublic, {
        type: "refund",
        title: "Manual Refund Required",
        message: `${order.orderNumber}: the ${providerResult.provider} refund request failed (${providerResult.error}). Complete the money refund in the ${providerResult.provider} dashboard.`,
        link: "/admin/payments",
      });
    } else {
      await ctx.runMutation(internal.notifications.createPublic, {
        type: "refund",
        title: "Refund Completed",
        message: `Refund for order ${order.orderNumber} was processed.`,
        link: "/admin/returns",
      });
    }

    return { ok: true, providerResult };
  },
});

async function getPesapalToken(ctx: ActionCtx): Promise<string> {
  const cached = await ctx.runQuery(internal.pesapal.getSetting, { key: SETTING_TOKEN });
  const expiry = await ctx.runQuery(internal.pesapal.getSetting, { key: SETTING_TOKEN_EXPIRY });
  if (typeof cached === "string" && cached && typeof expiry === "number" && expiry > Date.now()) {
    return cached;
  }
  const response = await fetch(PESAPAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET,
    }),
  });
  if (!response.ok) throw new Error("Failed to authenticate with Pesapal");
  const data = await response.json();
  if (typeof data.token !== "string" || !data.token) throw new Error("Invalid Pesapal token response");
  await ctx.runMutation(internal.pesapal.setSetting, { key: SETTING_TOKEN, value: data.token });
  await ctx.runMutation(internal.pesapal.setSetting, {
    key: SETTING_TOKEN_EXPIRY,
    value: Date.now() + 4 * 60 * 1000,
  });
  return data.token;
}

async function requestProviderRefund(
  ctx: ActionCtx,
  order: Doc<"orders">,
  adminName: string
): Promise<ProviderRefundResult> {
  const payments = await ctx.runQuery(internal.payments.getByOrderIdInternal, {
    orderId: order._id,
  });
  const payment = payments[0];
  if (!payment) return { ok: true, provider: "unknown" };

  if (payment.provider === "stripe") {
    if (!STRIPE_SECRET_KEY) {
      return { ok: false, provider: "stripe", error: "STRIPE_SECRET_KEY not configured" };
    }
    const chargeId = (payment.metadata as Record<string, unknown> | undefined)?.latest_charge;
    if (typeof chargeId !== "string" || !chargeId) {
      return { ok: false, provider: "stripe", error: "missing latest_charge on payment" };
    }
    try {
      const res = await fetch(`https://api.stripe.com/v1/charges/${chargeId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ amount: String(Math.round(order.total * 100)) }).toString(),
      });
      if (res.ok) return { ok: true, provider: "stripe" };
      const err = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return {
        ok: false,
        provider: "stripe",
        error: err.error?.message ?? `HTTP ${res.status}`,
      };
    } catch (e) {
      return { ok: false, provider: "stripe", error: e instanceof Error ? e.message : String(e) };
    }
  }

  if (payment.provider === "pesapal") {
    try {
      const token = await getPesapalToken(ctx);
      const meta = (payment.metadata ?? {}) as Record<string, unknown>;
      let confirmationCode =
        typeof meta.confirmation_code === "string" ? meta.confirmation_code : undefined;
      if (!confirmationCode) {
        // confirmation_code is only known after a successful status query.
        const statusRes = await fetch(
          `${PESAPAL_STATUS_URL}?orderTrackingId=${encodeURIComponent(payment.paymentId)}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
        );
        if (statusRes.ok) {
          const status = (await statusRes.json()) as { confirmation_code?: string };
          confirmationCode = status.confirmation_code;
        }
      }
      if (!confirmationCode) {
        return { ok: false, provider: "pesapal", error: "missing confirmation_code" };
      }
      const res = await fetch(PESAPAL_REFUND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmation_code: confirmationCode,
          amount: Number(order.total),
          username: adminName || "Admin",
          remarks: `Refund for order ${order.orderNumber}`,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: number;
        status?: number;
        message?: string;
      } | null;
      if (data && (data.error === 200 || data.status === 200)) {
        return { ok: true, provider: "pesapal" };
      }
      return {
        ok: false,
        provider: "pesapal",
        error: data?.message ?? `HTTP ${res.status}`,
      };
    } catch (e) {
      return { ok: false, provider: "pesapal", error: e instanceof Error ? e.message : String(e) };
    }
  }

  return { ok: true, provider: payment.provider };
}
