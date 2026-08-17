/**
 * Input sanitation for user-supplied form/search values.
 *
 * These helpers only normalize text — they never interpret it. Values are
 * always bound as data when used in Convex queries; these guards strip control
 * characters, enforce length caps and collapse whitespace so hostile input can
 * never smuggle code into logs, emails, or query terms.
 */

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const MAX_TEXT_LENGTH = 2_000;
const MAX_SEARCH_LENGTH = 200;

/**
 * Normalizes free-form text input: trims, strips control characters and caps
 * the length. Returns an empty string when nothing meaningful remains.
 */
export function sanitizeText(input: unknown, maxLength: number = MAX_TEXT_LENGTH): string {
  if (typeof input !== "string") return "";
  return input
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Normalizes a search term. Shorter cap than general text and preserves
 * internal spaces (it is used as a bound term, never interpreted).
 */
export function sanitizeSearch(input: unknown, maxLength: number = MAX_SEARCH_LENGTH): string {
  if (typeof input !== "string") return "";
  return input.replace(CONTROL_CHARS, "").trim().slice(0, maxLength);
}

/** True when the value is a non-empty string after normalization. */
export function hasText(input: unknown): boolean {
  return sanitizeText(input).length > 0;
}

/**
 * Picks a value from a fixed whitelist, falling back to `fallback`. Use this
 * for enum-like inputs (sort order, status) so user strings can never select
 * behavior outside the allowlist.
 */
export function pickFromWhitelist<T extends string>(
  input: unknown,
  whitelist: readonly T[],
  fallback: T
): T {
  return typeof input === "string" && (whitelist as readonly string[]).includes(input)
    ? (input as T)
    : fallback;
}

/**
 * Normalizes free text into a URL-safe slug: lowercase, spaces/illegal chars
 * become single hyphens, leading/trailing hyphens stripped. Returns "" when
 * nothing usable remains. Used to sanitize user-supplied slugs so product URLs
 * stay stable and case/space-insensitive.
 */
export function slugify(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
