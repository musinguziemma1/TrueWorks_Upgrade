import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TrueWorks <noreply@trueworksgroup.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";

function escapeHtml(value: unknown): string {
  const AMP = "&" + "amp;";
  const LT = "&" + "lt;";
  const GT = "&" + "gt;";
  const QUOT = "&" + "quot;";
  const APOS = "&" + "#39;";
  return String(value ?? "")
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS);
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    processing: "Being processed",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    failed: "Failed",
  };
  return map[status] ?? status;
}

/**
 * Sends a transactional email to a customer when their order status changes.
 * Called from orders.updateStatus via scheduler.
 */
export const sendOrderStatusEmail = internalAction({
  args: {
    orderId: v.id("orders"),
    previousOrderStatus: v.optional(v.string()),
    previousPaymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; skipped?: boolean }> => {
    if (!RESEND_API_KEY || RESEND_API_KEY === "re_your_api_key_here") {
      console.log("[email] skipped (no RESEND_API_KEY)");
      return { sent: false, skipped: true };
    }

    const order = await ctx.runQuery(api.orders.getByIdInternal, { id: args.orderId });
    if (!order) return { sent: false, skipped: true };

    const changedStatus = order.orderStatus !== args.previousOrderStatus;
    const changedPayment = order.paymentStatus !== args.previousPaymentStatus;
    if (!changedStatus && !changedPayment) return { sent: false, skipped: true };

    const subject = `Order ${order.orderNumber} — ${statusLabel(order.orderStatus)}`;

    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 32px; color: #334155;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px;">
    <h2 style="color: #0B2545; margin: 0 0 16px;">Order Update</h2>
    <p style="margin: 0 0 12px;">Hi ${escapeHtml(order.customerName)},</p>
    <p style="margin: 0 0 16px;">Your order status has been updated.</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 6px;"><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
      <p style="margin: 0 0 6px;"><strong>Order status:</strong> ${escapeHtml(statusLabel(order.orderStatus))}</p>
      <p style="margin: 0;"><strong>Payment status:</strong> ${escapeHtml(statusLabel(order.paymentStatus))}</p>
    </div>
    <a href="${SITE_URL}/account/orders" style="display: inline-block; background: #C9A227; color: #0B2545; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Orders</a>
    <p style="margin: 24px 0 0; font-size: 12px; color: #64748b;">TrueWorks Limited — Kampala, Uganda</p>
  </div>
</body></html>`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [order.customerEmail],
          subject: subject.slice(0, 128),
          html,
        }),
      });
      return { sent: res.ok };
    } catch (err) {
      console.error("[email] order status failed:", err);
      return { sent: false };
    }
  },
});
