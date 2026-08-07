import { httpAction, internalAction } from "./_generated/server";
import { v } from "convex/values";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TrueWorks <noreply@trueworksgroup.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";
const EMAIL_API_SECRET = process.env.EMAIL_API_SECRET ?? "";

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

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
  const provided = request.headers.get("x-email-secret") ?? "";
  if (!timingSafeEqual(provided, EMAIL_API_SECRET)) {
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
    <h2>Payment Approved — Your Download is Ready!</h2>
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Great news! Your payment has been approved and your purchase is ready to download.</p>

    <div class="order-box">
      <h3 style="margin: 0 0 12px 0; color: #0b2545;">Invoice</h3>
      <p style="margin: 0 0 4px 0;"><strong>Order:</strong> ${escapeHtml(orderNumber)}</p>
      <p style="margin: 0 0 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
      <p style="margin: 0 0 12px 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">Paid</span></p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
        <p style="margin: 0;"><strong>Product(s):</strong> ${escapeHtml(productName)}</p>
      </div>
    </div>

    <a href="${escapeUrl(downloadUrl)}" class="button">Download Your File</a>

    <p><strong>Note:</strong> This download link will expire in 7 days. Please save the file to your computer after downloading.</p>
    <p>You can also access your downloads anytime from your account:</p>
    <a href="${SITE_URL}/account/downloads" class="button">View All Downloads</a>

    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
      Please keep this email for your records. If you have any questions about your order, reply to this email or contact us at <a href="mailto:hello@trueworksgroup.com">hello@trueworksgroup.com</a>.
    </p>
  `);

  const sent = await sendEmail({
    to: customerEmail,
    subject: `Payment Approved — Download Ready (${String(orderNumber).slice(0, 64)})`,
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

export const sendSubscriberWelcome = internalAction({
  args: {
    subscriberEmail: v.string(),
    subscriberName: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const greeting = args.subscriberName
      ? `Hi ${escapeHtml(args.subscriberName)},`
      : "Hi there,";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .banner { background: linear-gradient(135deg, #0b2545 0%, #13315c 50%, #0b2545 100%); padding: 40px 32px; text-align: center; position: relative; overflow: hidden; }
    .banner::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 60%); }
    .banner h1 { color: #ffffff; font-size: 28px; margin: 0 0 4px 0; font-weight: 700; letter-spacing: -0.5px; }
    .banner .accent { color: #c9a227; }
    .banner p { color: rgba(255,255,255,0.7); font-size: 14px; margin: 0; }
    .gold-bar { height: 3px; background: linear-gradient(90deg, #c9a227, #e8d48b, #c9a227); }
    .content { padding: 36px 32px; color: #334155; line-height: 1.7; }
    .content h2 { color: #0b2545; font-size: 22px; margin: 0 0 16px 0; }
    .content p { margin: 0 0 16px 0; font-size: 15px; }
    .benefits { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .benefits h3 { color: #0b2545; font-size: 16px; margin: 0 0 16px 0; }
    .benefit-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
    .benefit-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #c9a227, #e8d48b); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .benefit-icon span { color: #0b2545; font-size: 16px; }
    .benefit-text { font-size: 14px; color: #475569; }
    .benefit-text strong { color: #0b2545; }
    .button { display: inline-block; background: #c9a227; color: #0b2545; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 8px 0; letter-spacing: 0.3px; }
    .button:hover { background: #d4af37; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .footer { padding: 28px 32px; background: #0b2545; text-align: center; }
    .footer p { color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 0 8px 0; }
    .footer a { color: #c9a227; text-decoration: none; }
    .footer .brand { color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>Welcome to <span class="accent">TrueWorks</span></h1>
      <p>You're now part of our newsletter community</p>
    </div>
    <div class="gold-bar"></div>
    <div class="content">
      <h2>You're In! 🎉</h2>
      <p>${greeting}</p>
      <p>Thank you for subscribing to the TrueWorks newsletter. You've just unlocked access to exclusive insights, industry trends, and premium resources designed to help your organization operate smarter and grow faster.</p>

      <div class="benefits">
        <h3>Here's What You'll Receive:</h3>
        <div class="benefit-item">
          <div class="benefit-icon"><span>📊</span></div>
          <div class="benefit-text"><strong>Industry Insights</strong> — Deep dives into operational excellence, financial modeling, and business intelligence trends.</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon"><span>🎁</span></div>
          <div class="benefit-text"><strong>Exclusive Resources</strong> — Free templates, dashboards, and guides before they hit the store.</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon"><span>💡</span></div>
          <div class="benefit-text"><strong>Expert Tips</strong> — Practical advice from our team on optimizing your business operations.</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon"><span>🏷️</span></div>
          <div class="benefit-text"><strong>Subscriber-Only Deals</strong> — Special discounts and early access to new product launches.</div>
        </div>
      </div>

      <p>In the meantime, why not explore what we have to offer?</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${SITE_URL}/store" class="button">Browse the Store →</a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 13px; color: #64748b; margin: 0;">
        We respect your inbox. You'll receive newsletters no more than twice a month. If you ever want to unsubscribe, click the link at the bottom of any newsletter email or email us at <a href="mailto:hello@trueworksgroup.com" style="color: #c9a227;">hello@trueworksgroup.com</a>.
      </p>
    </div>
    <div class="footer">
      <p class="brand">TrueWorks</p>
      <p>Premium Business Operating Systems</p>
      <p>Kampala, Uganda · <a href="${SITE_URL}">trueworksgroup.com</a></p>
      <p>© ${new Date().getFullYear()} TrueWorks Limited. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const sent = await sendEmail({
      to: args.subscriberEmail,
      subject: "Welcome to TrueWorks — You're In! 🎉",
      html,
    });

    return { sent };
  },
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

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

export const sendTeamInvitation = internalAction({
  args: {
    to: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    invitedBy: v.string(),
    invitationId: v.string(),
  },
  handler: async (_ctx, args) => {
    const signupUrl = `${SITE_URL}/sign-up`;
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = baseTemplate(`
      <h2>You've Been Invited to the TrueWorks Team</h2>
      <p>Hi there,</p>
      <p><strong>${escapeHtml(args.invitedBy)}</strong> has invited you to join the TrueWorks admin team as an <strong>${escapeHtml(ROLE_LABELS[args.role] ?? args.role)}</strong>.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Your Role:</strong> ${escapeHtml(ROLE_LABELS[args.role] ?? args.role)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Invited By:</strong> ${escapeHtml(args.invitedBy)}</p>
        <p style="margin: 0;"><strong>Expires:</strong> ${expiryDate}</p>
      </div>

      <p>As an <strong>${escapeHtml(ROLE_LABELS[args.role] ?? args.role)}</strong>, you will be able to:</p>
      <ul>
        ${args.role === "admin"
          ? "<li>Manage products, orders, customers, and content</li><li>View analytics and reports</li><li>Manage team members and settings</li>"
          : args.role === "editor"
          ? "<li>Create and edit products, content, and resources</li><li>Manage orders and customer communications</li><li>View analytics and reports</li>"
          : "<li>View the admin dashboard and analytics</li><li>View products, orders, and customer data</li>"}
      </ul>

      <p>To accept this invitation and create your account, click the button below:</p>

      <a href="${escapeUrl(signupUrl)}" class="button">Accept Invitation & Sign Up</a>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        This invitation expires on <strong>${expiryDate}</strong>. If you did not expect this invitation, you can safely ignore this email.
      </p>

      <p>If you have any questions, reply to this email or contact us at <a href="mailto:hello@trueworksgroup.com">hello@trueworksgroup.com</a>.</p>
    `);

    const sent = await sendEmail({
      to: args.to,
      subject: `You've Been Invited to Join TrueWorks as ${ROLE_LABELS[args.role] ?? args.role}`,
      html,
    });

    return { sent };
  },
});
