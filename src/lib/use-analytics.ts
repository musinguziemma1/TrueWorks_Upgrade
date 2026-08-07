"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

const SESSION_KEY = "trueworks-session";

export type TrackEvent =
  | "view_product"
  | "add_to_cart"
  | "reach_checkout"
  | "payment_start"
  | "purchase";

/**
 * Fire-and-forget conversion-funnel tracking. Call `track()` from the relevant
 * user action (view, add-to-cart, checkout reached, payment started, purchase).
 */
export function useAnalytics() {
  const trackMutation = useMutation(api.analyticsEvents.track);
  const sessionRef = useRef<string>("");

  useEffect(() => {
    if (sessionRef.current) return;
    let id = "";
    try {
      id = localStorage.getItem(SESSION_KEY) ?? "";
    } catch {
      id = "";
    }
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      try {
        localStorage.setItem(SESSION_KEY, id);
      } catch {}
    }
    sessionRef.current = id;
  }, []);

  const track = useCallback(
    async (
      event: TrackEvent,
      opts?: {
        productId?: string;
        productName?: string;
        category?: string;
        value?: number;
        email?: string;
        path?: string;
        referrer?: string;
      }
    ) => {
      try {
        await trackMutation({
          event,
          sessionId: sessionRef.current || undefined,
          productId: opts?.productId,
          productName: opts?.productName,
          category: opts?.category,
          value: opts?.value,
          email: opts?.email,
          path: opts?.path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
          referrer: opts?.referrer ?? (typeof window !== "undefined" ? document.referrer || undefined : undefined),
        });
      } catch {
        // Analytics must never break the user flow.
      }
    },
    [trackMutation]
  );

  return { track };
}