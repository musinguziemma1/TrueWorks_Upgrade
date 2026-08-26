import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { brandLogo, brandContactLine } from "./emailBranding";

type AbandonedCart = {
  recovered?: boolean;
  recoveryEmailSentAt?: number;
  createdAt: number;
  items: Array<{ slug: string; name: string; quantity: number; price: number }>;
};

export const sendRecoveryEmails = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: number; total: number }> => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const carts = await ctx.runQuery(internal.abandonedCarts.listInternal, {});

    const abandoned = carts.filter(
      (cart: AbandonedCart) => !cart.recovered && !cart.recoveryEmailSentAt && cart.createdAt < oneHourAgo
    );

    let sent = 0;
    for (const cart of abandoned) {
      const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";
      const itemsHtml = cart.items
        .map(
          (item: AbandonedCart["items"][number]) =>
            `<tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;">
                <a href="${SITE_URL}/store/${item.slug}" style="color:#0b2545;text-decoration:none;font-weight:600;">${item.name}</a>
              </td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">$${item.price.toFixed(2)}</td>
            </tr>`
        )
        .join("");

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .banner { background: linear-gradient(135deg, #0b2545 0%, #13315c 50%, #0b2545 100%); padding: 36px 32px; text-align: center; }
    .banner h1 { color: #ffffff; font-size: 24px; margin: 0; }
    .banner .accent { color: #c9a227; }
    .gold-bar { height: 3px; background: linear-gradient(90deg, #c9a227, #e8d48b, #c9a227); }
    .content { padding: 32px; color: #334155; line-height: 1.6; }
    .content h2 { color: #0b2545; font-size: 20px; margin: 0 0 12px 0; }
    .content p { margin: 0 0 16px 0; font-size: 15px; }
    .cart-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .cart-table th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .total-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: right; }
    .total-box .amount { font-size: 24px; font-weight: 700; color: #0b2545; }
    .button { display: inline-block; background: #c9a227; color: #0b2545; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 8px 0; }
    .footer { padding: 24px 32px; background: #0b2545; text-align: center; }
    .footer p { color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 0 8px 0; }
    .footer .brand { color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <div style="margin-bottom: 16px;">${brandLogo("dark", 220)}</div>
      <h1>You left something in your <span class="accent">cart</span></h1>
    </div>
    <div class="gold-bar"></div>
    <div class="content">
      <h2>Still interested?</h2>
      <p>You had some great picks! Your cart is waiting for you. Complete your purchase before these items are gone.</p>
      <table class="cart-table">
        <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="total-box"><div>Cart Total</div><div class="amount">$${cart.totalValue.toFixed(2)}</div></div>
      <div style="text-align: center; margin: 28px 0;"><a href="${SITE_URL}/cart" class="button">Complete Your Purchase →</a></div>
      <p style="font-size: 13px; color: #64748b;">Need help? Reply to this email or contact us at <a href="mailto:info@trueworksgroup.com" style="color: #c9a227;">info@trueworksgroup.com</a>.</p>
    </div>
    <div class="footer">${brandContactLine()}<p>Premium Business Operating Systems</p><p>© ${new Date().getFullYear()} TrueWorks Limited.</p></div>
  </div>
</body></html>`;

      try {
        const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
        const EMAIL_FROM = process.env.EMAIL_FROM ?? "TrueWorks <noreply@trueworksgroup.com>";

        if (RESEND_API_KEY && RESEND_API_KEY !== "re_your_api_key_here") {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: EMAIL_FROM,
              to: [cart.email],
              subject: "You left items in your cart — Complete your purchase",
              html,
            }),
          });
        }

        sent++;
      } catch (error) {
        console.error("Failed to send recovery email:", error);
      }

      // Mark as emailed regardless of send success/failure to avoid hammering
      // the same carts every cron tick.
      try {
        await ctx.runMutation(internal.abandonedCarts._internalUpdate, {
          id: cart._id,
          recoveryEmailSentAt: Date.now(),
        });
      } catch (error) {
        console.error("Failed to mark cart emailed:", error);
      }
    }

    return { sent, total: abandoned.length };
  },
});
