/**
 * Shared branding + official company contact details for all outbound email
 * templates. Keep every template's header/footer in sync through this module.
 *
 * NOTE: Email clients block relative paths and most block SVG, so logo images
 * must be absolute PNG URLs served from the website (public/images/).
 * - logo-email-dark.png  → white/gold logo on transparent (for navy headers/footers)
 * - logo-email-light.png → navy/gold logo on transparent (for white backgrounds)
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";

export const BRAND_NAME = "TrueWorks";
export const BRAND_TAGLINE = "Business Operating Systems";

/** Official company contact details. */
export const CONTACT_EMAIL = "info@trueworksgroup.com";
export const CONTACT_PHONE_DISPLAY = "+256 773 728 944";
export const CONTACT_PHONE_TEL = "tel:+256773728944";
export const CONTACT_WHATSAPP = "https://wa.me/256773728944";

/** Absolute logo URLs for use in email HTML. */
export const LOGO_URL_DARK = `${SITE_URL}/images/logo-email-dark.png`;
export const LOGO_URL_LIGHT = `${SITE_URL}/images/logo-email-light.png`;

/** Natural aspect ratio of the horizontal logo lockup (~1600×760). */
const LOGO_ASPECT = 0.48;

/**
 * Render the TrueWorks logo as an email-safe <img> tag.
 * @param variant "dark" = white/gold logo for navy backgrounds,
 *                "light" = navy/gold logo for white backgrounds.
 * @param width   Rendered width in px (height follows the logo aspect ratio).
 */
export function brandLogo(variant: "dark" | "light" = "dark", width = 220): string {
  const src = variant === "dark" ? LOGO_URL_DARK : LOGO_URL_LIGHT;
  const height = Math.round(width * LOGO_ASPECT);
  return `<img src="${src}" width="${width}" height="${height}" alt="${BRAND_NAME} — ${BRAND_TAGLINE}" style="display:inline-block;border:0;outline:none;text-decoration:none;max-width:100%;height:auto;" />`;
}

/** Contact line for email footers: email · phone · WhatsApp links. */
export function brandContactLine(color = "#c9a227"): string {
  return `<p>${BRAND_NAME} Limited · Kampala, Uganda<br />
    <a href="mailto:${CONTACT_EMAIL}" style="color:${color};text-decoration:none;">${CONTACT_EMAIL}</a>
    &nbsp;·&nbsp;
    <a href="${CONTACT_PHONE_TEL}" style="color:${color};text-decoration:none;">${CONTACT_PHONE_DISPLAY}</a></p>`;
}
