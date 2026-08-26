"use client";

import { useEffect, useState } from "react";

/**
 * Debounce a fast-changing value (e.g. a search input) so downstream
 * subscriptions — Convex queries in particular — only see the settled value.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
