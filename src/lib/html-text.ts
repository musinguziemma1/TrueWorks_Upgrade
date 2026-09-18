/**
 * DOM-free HTML → plain text.
 *
 * DOMPurify needs a DOM, so it cannot run while a page is prerendered on the
 * server (`dompurify` resolves to its factory there, with `sanitize` undefined).
 * Article and product copy still has to reach crawlers, so the server renders
 * this readable plain-text form and the rich, sanitised HTML is swapped in after
 * hydration.
 *
 * Deliberately pure string work — no DOM, no regex state — so the server and the
 * browser always produce byte-identical output and hydration never mismatches.
 */

/** Tags whose boundary should become a paragraph break. */
const BLOCK_BOUNDARY =
  /<\/(p|div|section|article|li|h[1-6]|blockquote|table|tr|ul|ol|pre|figure)\s*>|<br\s*\/?>/gi;

/** Elements whose *content* must be dropped, not just their tags. */
const DROPPED_ELEMENTS = /<(script|style|template)\b[\s\S]*?<\/\1\s*>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  times: "×",
  middot: "·",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const digits = isHex ? entity.slice(2) : entity.slice(1);
      const code = Number.parseInt(digits, isHex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Splits HTML into plain-text paragraphs, dropping tags and decoding the
 * entities that show up in admin-authored rich text. Returns one entry per
 * paragraph so the caller can render real `<p>` elements.
 */
export function htmlToParagraphs(html: string): string[] {
  if (!html) return [];
  const stripped = html
    .replace(DROPPED_ELEMENTS, "")
    .replace(BLOCK_BOUNDARY, "\n\n")
    .replace(/<[^>]*>/g, "");

  return decodeEntities(stripped)
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").replace(/[ \t]+/g, " ").trim())
    .filter((block) => block.length > 0);
}