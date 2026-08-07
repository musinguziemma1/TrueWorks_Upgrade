"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

/**
 * Resolves a signed preview URL for a product's sellable file.
 * Requires authentication + an active download grant (server-enforced), so the
 * sellable file URL is never embedded in public payloads.
 *
 * The id may be absent on first render (async query); pass it explicitly to
 * `resolve(id)` at click time to avoid a stale-capture bug.
 */
export function useSignedPreviewUrl(productId?: Id<"products"> | string) {
  const getPreviewUrl = useMutation(api.downloads.getPreviewUrl);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(
    async (id?: Id<"products"> | string) => {
      if (!id && !productId) return null;
      setLoading(true);
      setError(null);
      try {
        const signed = await getPreviewUrl({ productId: ((id ?? productId) as Id<"products">) });
        setUrl(signed ?? null);
        return signed ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Preview unavailable";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getPreviewUrl, productId]
  );

  return { url, loading, error, resolve, reset: () => { setUrl(null); setError(null); } };
}