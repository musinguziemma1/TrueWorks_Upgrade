/**
 * Shared settings schema — a single source of truth for every editable
 * setting. Used by:
 *   - convex/settings.ts  → whitelist, validation, coercion, secret masking
 *   - admin settings UI   → renders fields dynamically, client-side validation
 *
 * Pure module: no Convex imports so it can run in both environments.
 */

export type SettingTab = "general" | "branding" | "email" | "payment" | "downloads" | "security";

export type SettingType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "css"
  | "textarea"
  | "url"
  | "email";

export interface SettingOption {
  value: string;
  label: string;
}

export interface SettingField {
  key: string;
  tab: SettingTab;
  label: string;
  description?: string;
  type: SettingType;
  default: string | number | boolean;
  options?: SettingOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Secrets are never returned by getAll — masked as a sentinel instead. */
  secret?: boolean;
  /** live = actually enforced in the running app; planned = stored but dormant. */
  status?: "live" | "planned";
  /** Returns an error message, or null when valid. */
  validate?: (value: string | number | boolean) => string | null;
}

export const SETTING_FIELDS: SettingField[] = [
  // ─── General ────────────────────────────────────────────────────────────
  { key: "siteName", tab: "general", type: "text", label: "Site Name", default: "TrueWorks Limited", status: "live", validate: (v) => (String(v).trim().length === 0 ? "Site name is required" : null) },
  { key: "siteTagline", tab: "general", type: "text", label: "Tagline", default: "Digital Products Marketplace", status: "live" },
  { key: "siteDescription", tab: "general", type: "textarea", label: "Description", default: "Your premier destination for high-quality digital products, templates, and tools.", status: "live" },
  { key: "siteUrl", tab: "general", type: "url", label: "Site URL", default: "", placeholder: "https://trueworks.com", status: "live", validate: (v) => { const s = String(v).trim(); if (!s) return null; return /^https?:\/\/.+/i.test(s) ? null : "Enter a valid URL starting with http(s)://" } },
  { key: "siteLogo", tab: "general", type: "text", label: "Site Logo", default: "", placeholder: "Uploaded logo URL" },
  { key: "siteFavicon", tab: "general", type: "text", label: "Favicon", default: "", placeholder: "Uploaded favicon URL" },

  // ─── Branding ───────────────────────────────────────────────────────────
  { key: "primaryColor", tab: "branding", type: "color", label: "Primary Color", default: "#0B2545", status: "live" },
  { key: "secondaryColor", tab: "branding", type: "color", label: "Secondary Color", default: "#3E6990", status: "live" },
  { key: "accentColor", tab: "branding", type: "color", label: "Accent Color", default: "#C9A227", status: "live" },
  { key: "backgroundColor", tab: "branding", type: "color", label: "Background Color", default: "#FFFFFF", status: "live" },
  { key: "surfaceColor", tab: "branding", type: "color", label: "Surface Color", default: "#FAFBFC", status: "live" },
  { key: "foregroundColor", tab: "branding", type: "color", label: "Foreground Color", default: "#1E293B", status: "live" },
  { key: "headingFont", tab: "branding", type: "select", label: "Heading Font", default: "georgia", options: [
    { value: "georgia", label: "Georgia, Times New Roman, serif" },
    { value: "inter", label: "Inter, sans-serif" },
    { value: "playfair", label: "Playfair Display, serif" },
  ], status: "live" },
  { key: "bodyFont", tab: "branding", type: "select", label: "Body Font", default: "calibri", options: [
    { value: "calibri", label: "Calibri, Source Sans 3, system-ui, sans-serif" },
    { value: "inter", label: "Inter, sans-serif" },
    { value: "opensans", label: "Open Sans, sans-serif" },
  ], status: "live" },
  { key: "customCss", tab: "branding", type: "css", label: "Custom CSS", default: "", status: "live" },

  // ─── Email ──────────────────────────────────────────────────────────────
  { key: "smtpHost", tab: "email", type: "text", label: "SMTP Host", default: "", placeholder: "smtp.trueworks.com", status: "planned" },
  { key: "smtpPort", tab: "email", type: "number", label: "SMTP Port", default: 587, min: 1, max: 65535, status: "planned" },
  { key: "smtpUsername", tab: "email", type: "text", label: "SMTP Username", default: "", placeholder: "noreply@trueworks.com", status: "planned" },
  { key: "smtpPassword", tab: "email", type: "text", label: "SMTP Password", default: "", placeholder: "Leave blank to keep current password", secret: true, status: "planned" },
  { key: "smtpFrom", tab: "email", type: "email", label: "From Email", default: "", placeholder: "noreply@trueworks.com", status: "planned", validate: (v) => { const s = String(v).trim(); if (!s) return null; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : "Enter a valid email address" } },

  // ─── Payment ────────────────────────────────────────────────────────────
  { key: "currency", tab: "payment", type: "select", label: "Default Currency", default: "USD", options: [
    { value: "USD", label: "USD (US Dollar)" },
    { value: "UGX", label: "UGX (Ugandan Shilling)" },
    { value: "KES", label: "KES (Kenyan Shilling)" },
    { value: "EUR", label: "EUR (Euro)" },
    { value: "GBP", label: "GBP (British Pound)" },
  ], status: "live" },
  { key: "taxRate", tab: "payment", type: "number", label: "Tax Rate (%)", default: 18, min: 0, max: 100, step: 0.5, status: "live" },
  { key: "taxAutoCalculate", tab: "payment", type: "boolean", label: "Auto-Calculate Tax", description: "Automatically compute tax on checkout", default: true, status: "live" },
  { key: "currencyAutoConvert", tab: "payment", type: "boolean", label: "Auto-Convert Currency", description: "Fetch live exchange rates for currency conversion", default: true, status: "live" },
  { key: "conversionRate", tab: "payment", type: "number", label: "Custom Conversion Rate (vs USD)", default: 0, min: 0, step: 0.01, status: "live" },
  { key: "pesapalEnabled", tab: "payment", type: "boolean", label: "Pesapal", description: "Mobile Money & card payments via Pesapal", default: true, status: "live" },
  { key: "pesapalMode", tab: "payment", type: "select", label: "Pesapal Environment", default: "live", options: [
    { value: "sandbox", label: "Sandbox (test mode)" },
    { value: "live", label: "Live (production)" },
  ], status: "live" },
  { key: "pesapalEmail", tab: "payment", type: "email", label: "Pesapal Notification Email", default: "", placeholder: "payments@trueworks.com", status: "live", validate: (v) => { const s = String(v).trim(); if (!s) return null; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : "Enter a valid email address" } },
  { key: "stripeEnabled", tab: "payment", type: "boolean", label: "Stripe (Card)", description: "International card payments", default: true, status: "live" },
  { key: "stripeEmail", tab: "payment", type: "email", label: "Stripe Notification Email", default: "", placeholder: "payments@trueworks.com", status: "live", validate: (v) => { const s = String(v).trim(); if (!s) return null; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : "Enter a valid email address" } },
  { key: "mtnMomoEnabled", tab: "payment", type: "boolean", label: "MTN Mobile Money", description: "Direct MTN MoMo payments", default: false, status: "planned" },
  { key: "airtelMoneyEnabled", tab: "payment", type: "boolean", label: "Airtel Money", description: "Direct Airtel payments", default: false, status: "planned" },
  { key: "paypalEnabled", tab: "payment", type: "boolean", label: "PayPal", description: "PayPal payments", default: false, status: "planned" },

  // ─── Downloads ──────────────────────────────────────────────────────────
  { key: "maxDownloadsPerPurchase", tab: "downloads", type: "number", label: "Max Downloads Per Purchase", default: 5, min: 1, max: 100, status: "planned" },
  { key: "downloadLinkExpiryDays", tab: "downloads", type: "number", label: "Download Link Expiry (days)", default: 30, min: 1, max: 365, status: "planned" },
  { key: "downloadMethod", tab: "downloads", type: "select", label: "Download Method", default: "direct", options: [
    { value: "direct", label: "Direct Download" },
    { value: "signed", label: "Signed URL (S3)" },
    { value: "token", label: "Token-based" },
  ], status: "planned" },
  { key: "requireLoginToDownload", tab: "downloads", type: "boolean", label: "Require Login to Download", default: true, status: "planned" },
  { key: "downloadNotifications", tab: "downloads", type: "boolean", label: "Download Notifications", description: "Send email when a download is available", default: true, status: "planned" },
  { key: "storageProvider", tab: "downloads", type: "select", label: "Storage Provider", default: "local", options: [
    { value: "local", label: "Local (Convex)" },
    { value: "s3", label: "AWS S3" },
    { value: "gcs", label: "Google Cloud Storage" },
    { value: "do", label: "DigitalOcean Spaces" },
  ], status: "planned" },
  { key: "storageMax", tab: "downloads", type: "number", label: "Storage Limit (GB)", default: 10, min: 1, max: 1024, status: "planned" },

  // ─── Security ───────────────────────────────────────────────────────────
  { key: "require2fa", tab: "security", type: "boolean", label: "Two-Factor Authentication (2FA)", description: "Require 2FA for admin account access", default: false, status: "live" },
  { key: "passwordExpiryDays", tab: "security", type: "number", label: "Password Expiry (days)", default: 90, min: 0, max: 730, status: "live" },
  { key: "sessionTimeoutMinutes", tab: "security", type: "number", label: "Session Timeout (minutes)", default: 60, min: 5, max: 1440, status: "live" },
  { key: "maxLoginAttempts", tab: "security", type: "number", label: "Max Login Attempts", default: 5, min: 1, max: 50, status: "live" },
  { key: "requireVerificationCode", tab: "security", type: "boolean", label: "Verification Code at Sign-In", description: "Require email verification code to complete sign-in", default: true, status: "live" },
  { key: "verificationCodeExpiry", tab: "security", type: "number", label: "Verification Code Expiry (minutes)", default: 10, min: 1, max: 60, status: "live" },
  { key: "signOutVerification", tab: "security", type: "boolean", label: "Verification at Sign-Out", description: "Require verification code to sign out of admin sessions", default: false, status: "live" },
  { key: "apiRateLimiting", tab: "security", type: "boolean", label: "API Rate Limiting", description: "Throttle requests to prevent abuse", default: true, status: "live" },
  { key: "ipWhitelist", tab: "security", type: "boolean", label: "IP Whitelist", description: "Restrict admin access to specific IPs", default: false, status: "planned" },
  { key: "apiKey", tab: "security", type: "text", label: "API Key", default: "", secret: true, status: "planned" },
];

export const SETTING_BY_KEY: Record<string, SettingField> = Object.fromEntries(
  SETTING_FIELDS.map((f) => [f.key, f])
);

export const SETTING_DEFAULTS: Record<string, string | number | boolean> = Object.fromEntries(
  SETTING_FIELDS.map((f) => [f.key, f.default])
);

/** Keys published to the public storefront via settings.getPublic. */
export const PUBLIC_SETTING_KEYS = [
  "siteName", "siteTagline", "siteDescription", "siteUrl",
  "siteLogo", "siteFavicon",
  "primaryColor", "secondaryColor", "accentColor", "backgroundColor",
  "surfaceColor", "foregroundColor", "headingFont", "bodyFont", "customCss",
  "currency", "taxRate", "pesapalEnabled", "stripeEnabled",
] as const;

/** Sentinel used in getAll for secret values — never leaks the real secret. */
export const SECRET_MASK = "••••••••";

export const SECRET_KEYS = SETTING_FIELDS.filter((f) => f.secret).map((f) => f.key);

export function isSecretKey(key: string): boolean {
  return SECRET_KEYS.includes(key);
}

/**
 * Validate + coerce a value for a given setting key.
 * Returns { ok: true, value } or { ok: false, error }.
 */
export function validateSettingValue(
  key: string,
  raw: unknown
): { ok: true; value: string | number | boolean } | { ok: false; error: string } {
  const field = SETTING_BY_KEY[key];
  if (!field) return { ok: false, error: `Unknown setting: ${key}` };

  let value: string | number | boolean;
  switch (field.type) {
    case "number": {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) return { ok: false, error: `${field.label} must be a number` };
      if (field.min !== undefined && n < field.min) return { ok: false, error: `${field.label} must be at least ${field.min}` };
      if (field.max !== undefined && n > field.max) return { ok: false, error: `${field.label} must be at most ${field.max}` };
      value = n;
      break;
    }
    case "boolean":
      value = typeof raw === "boolean" ? raw : raw === "true" || raw === true;
      break;
    case "select": {
      const s = String(raw ?? "");
      const valid = field.options?.some((o) => o.value === s);
      if (!valid) return { ok: false, error: `${field.label} has an invalid value` };
      value = s;
      break;
    }
    case "url": {
      const s = String(raw ?? "").trim();
      if (field.validate) {
        const err = field.validate(s);
        if (err) return { ok: false, error: err };
      }
      value = s;
      break;
    }
    case "email": {
      const s = String(raw ?? "").trim();
      if (field.validate) {
        const err = field.validate(s);
        if (err) return { ok: false, error: err };
      }
      value = s;
      break;
    }
    default:
      value = String(raw ?? "");
  }

  if (field.type !== "select" && field.type !== "url" && field.type !== "email" && field.validate) {
    const err = field.validate(value);
    if (err) return { ok: false, error: err };
  }

  return { ok: true, value };
}
