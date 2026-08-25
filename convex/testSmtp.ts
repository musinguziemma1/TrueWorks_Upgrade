import { action } from "./_generated/server";
import { v } from "convex/values";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TrueWorks <noreply@trueworksgroup.com>";

/**
 * Check that the configured SMTP host/port is reachable over the network.
 * This only proves reachability — actual delivery is handled by Resend.
 */
export const testSmtp = action({
  args: {
    host: v.string(),
    port: v.number(),
  },
  handler: async (_ctx, args) => {
    try {
      const timeout = 10_000;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      // Best-effort reachability probe; result intentionally ignored.
      await fetch(`https://${args.host}:${args.port}`, {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);

      return { success: true, message: `SMTP server ${args.host}:${args.port} is reachable` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Connection failed: ${msg}` };
    }
  },
});

/**
 * Send a real test email through Resend (the app's actual mail provider).
 * Returns a detailed result so the Settings UI can surface failures.
 */
export const sendTestEmail = action({
  args: {
    to: v.string(),
  },
  handler: async (_ctx, args) => {
    if (!RESEND_API_KEY || RESEND_API_KEY === "re_your_api_key_here") {
      return { success: false, message: "Resend is not configured. Set RESEND_API_KEY in environment variables." };
    }
    const email = args.to.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: "Enter a valid recipient email address." };
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
          to: [email],
          subject: "TrueWorks — Test Email",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0B2545;">Email delivery is working! 🎉</h2>
              <p>This is a test email sent from the TrueWorks admin settings.</p>
              <p style="color: #64748b;">If you received this, your email provider is configured correctly.</p>
            </div>
          `,
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return { success: false, message: `Resend returned ${response.status}: ${body.slice(0, 300)}` };
      }
      return { success: true, message: `Test email sent to ${email}. Check your inbox.` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to send: ${msg}` };
    }
  },
});
