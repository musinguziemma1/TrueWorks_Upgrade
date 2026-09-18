"use client";

import { useMemo, useSyncExternalStore } from "react";
import DOMPurify from "dompurify";
import { htmlToParagraphs } from "@/lib/html-text";

/** Mirrors the restrictions previously applied inline at the call site. */
const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
};

const subscribe = () => () => {};

/**
 * `false` while rendering on the server *and* during hydration, `true` after.
 *
 * This is React's own hydration-detection idiom: the server snapshot keeps the
 * first client render byte-identical to the SSR output, and the re-render after
 * hydration can differ safely. Using an effect here instead would trip the
 * `react-hooks/set-state-in-effect` rule (and cost a cascading render).
 */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

/**
 * Renders admin-authored HTML without letting anything executable through.
 *
 * DOMPurify requires a DOM, so it is unavailable during server prerendering —
 * `dompurify` resolves to its factory there, with `sanitize` undefined. Rather
 * than emit an empty block on the server (which is what made product and
 * article pages invisible to crawlers), the server renders the markup's text
 * content, then the sanitised rich HTML replaces it once hydrated. Every word
 * is therefore present in the HTML a crawler receives.
 */
export function SanitizedHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const isHydrated = useIsHydrated();

  const sanitized = useMemo(
    () => (isHydrated ? DOMPurify.sanitize(html, SANITIZE_OPTIONS) : null),
    [isHydrated, html]
  );

  if (sanitized === null) {
    return (
      <div className={className}>
        {htmlToParagraphs(html).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    );
  }

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />
  );
}