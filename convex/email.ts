import { httpAction } from "./_generated/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TrueWorks <noreply@trueworksgroup.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";
const EMAIL_API_SECRET = process.env.EMAIL_API_SECRET ?? "";

/**
 * All /email/* endpoints are server-to-server only. Callers must send the
 * shared secret in the x-email-secret header. Without this, anyone on the
 * internet could send branded email through our Resend account.
 */
function requireEmailAuth(request: Request): Response | null {
  if (!EMAIL_API_SECRET) {
    // Fail closed: if no secret is configured, nobody can send email
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  const provided = request.headers.get("x-email-secret");
  if (provided !== EMAIL_API_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeUrl(url: unknown): string {
  const raw = String(url ?? "");
  // Only allow http(s) and relative URLs in links
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) {
    return raw.replace(/"/g, "&quot;");
  }
  return "#";
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_your_api_key_here") {
    console.log("Email skipped (no API key):", payload.subject);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #0b2545; padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; }
    .content { padding: 32px; color: #334155; line-height: 1.6; }
    .button { display: inline-block; background: #c9a227; color: #0b2545; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .footer { padding: 24px 32px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
    .order-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .item-row:last-child { border-bottom: none; }
    .total { font-weight: 700; font-size: 18px; color: #0b2545; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TrueWorks</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>TrueWorks Limited | Kampala, Uganda</p>
      <p>© ${new Date().getFullYear()} TrueWorks. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export const sendOrderConfirmation = httpAction(async (ctx, request) => {
  const authError = requireEmailAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { orderNumber, customerEmail, customerName, items, total } = body;

  const itemsHtml = (items as { name: string; quantity: number; price: number }[]).map((item) =>
    `<div class="item-row"><span>${escapeHtml(item.name)} × ${escapeHtml(item.quantity)}</span><span>$${Number(item.price).toFixed(2)}</span></div>`
  ).join("");

  const html = baseTemplate(`
    <h2>Order Confirmed!</h2>
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Thank you for your purchase. Your order has been received and is being processed.</p>
    <div class="order-box">
      <p><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>
      ${itemsHtml}
      <div class="item-row total"><span>Total</span><span>$${Number(total).toFixed(2)}</span></div>
    </div>
    <p>Your download links will be available in your account once payment is confirmed.</p>
    <a href="${SITE_URL}/account/orders" class="button">View Your Orders</a>
    <p>If you have any questions, reply to this email or contact us at hello@trueworksgroup.com</p>
  `);

  const sent = await sendEmail({
    to: customerEmail,
    subject: `Order Confirmation - ${String(orderNumber).slice(0, 64)}`,
    html,
  });

  return new Response(JSON.stringify({ sent }), { status: 200 });
});

export const sendDownloadReady = httpAction(async (ctx, request) => {
  const authError = requireEmailAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { customerEmail, customerName, orderNumber, downloadUrl, productName } = body;

  const html = baseTemplate(`
    <h2>Your Download is Ready!</h2>
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Your purchase of <strong>${escapeHtml(productName)}</strong> is ready to download.</p>
    <p>Order: ${escapeHtml(orderNumber)}</p>
    <a href="${escapeUrl(downloadUrl)}" class="button">Download Now</a>
    <p><strong>Note:</strong> This download link will expire in 7 days. Please save the file to your computer after downloading.</p>
    <p>You can also access your downloads anytime from your account:</p>
    <a href="${SITE_URL}/account/downloads" class="button">View All Downloads</a>
  `);

  const sent = await sendEmail({
    to: customerEmail,
    subject: `Download Ready - ${String(productName).slice(0, 64)}`,
    html,
  });

  return new Response(JSON.stringify({ sent }), { status: 200 });
});

export const sendPaymentFailed = httpAction(async (ctx, request) => {
  const authError = requireEmailAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { customerEmail, customerName, orderNumber, amount } = body;

  const html = baseTemplate(`
    <h2>Payment Failed</h2>
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>We were unable to process your payment of <strong>$${Number(amount).toFixed(2)}</strong> for order <strong>${escapeHtml(orderNumber)}</strong>.</p>
    <p>This can happen if:</p>
    <ul>
      <li>You cancelled the payment prompt</li>
      <li>Insufficient funds</li>
      <li>Network timeout</li>
    </ul>
    <p>No worries — you can try again:</p>
    <a href="${SITE_URL}/store" class="button">Try Again</a>
    <p>If you continue to experience issues, please contact us at hello@trueworksgroup.com</p>
  `);

  const sent = await sendEmail({
    to: customerEmail,
    subject: `Payment Failed - ${String(orderNumber).slice(0, 64)}`,
    html,
  });

  return new Response(JSON.stringify({ sent }), { status: 200 });
});

export const sendRefundConfirmation = httpAction(async (ctx, request) => {
  const authError = requireEmailAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { customerEmail, customerName, orderNumber, amount, reason } = body;

  const html = baseTemplate(`
    <h2>Refund Processed</h2>
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Your refund of <strong>$${Number(amount).toFixed(2)}</strong> for order <strong>${escapeHtml(orderNumber)}</strong> has been processed.</p>
    ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    <p>The refund will appear on your statement within 5-10 business days.</p>
    <p>If you have any questions, please contact us at hello@trueworksgroup.com</p>
  `);

  const sent = await sendEmail({
    to: customerEmail,
    subject: `Refund Processed - ${String(orderNumber).slice(0, 64)}`,
    html,
  });

  return new Response(JSON.stringify({ sent }), { status: 200 });
});

export const sendWelcomeEmail = httpAction(async (ctx, request) => {
  const authError = requireEmailAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { customerEmail, customerName } = body;

  const html = baseTemplate(`
    <h2>Welcome to TrueWorks!</h2>
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Welcome to TrueWorks — your trusted source for premium business templates and systems built for Global organizations.</p>
    <p>Here's what you can do:</p>
    <ul>
      <li>Browse our collection of Excel templates, dashboards, and financial models</li>
      <li>Purchase and download instantly</li>
      <li>Access your downloads anytime from your account</li>
    </ul>
    <a href="${SITE_URL}/store" class="button">Explore the Store</a>
    <p>Need help? Reply to this email or visit our <a href="${SITE_URL}/faq">FAQ</a>.</p>
  `);

  const sent = await sendEmail({
    to: customerEmail,
    subject: "Welcome to TrueWorks!",
    html,
  });

  return new Response(JSON.stringify({ sent }), { status: 200 });
});

export const sendNewsletter = httpAction(async (ctx, request) => {
  const authError = requireEmailAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { subscriberEmail, subject, content } = body;

  // content is admin-authored HTML (sent only from the admin dashboard
  // via an authenticated internal call) — do not escape it.
  const html = baseTemplate(String(content ?? ""));

  const sent = await sendEmail({
    to: subscriberEmail,
    subject: String(subject ?? "").slice(0, 128),
    html,
  });

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
