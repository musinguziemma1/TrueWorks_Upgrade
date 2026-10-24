"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

const SESSION_KEY = "trueworks-session";

/**
 * Minimum gap between two writes of the same event for the same product.
 * Browsing is SPA-driven, so a single session can otherwise emit dozens of
 * `view_product` rows for one page view. The funnel still gets a signal —
 * just not one row per component mount. Bounded client-side writes keep the
 * analytics table inside the Free plan's mutation budget.
 */
const THROTTLE_MS: Record<TrackEvent, number> = {
  view_product: 60_000,
  add_to_cart: 0,
  reach_checkout: 0,
  payment_start: 0,
  purchase: 0,
};

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
  const lastSentRef = useRef<Map<string, number>>(new Map());

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
        productId?: Id<"products">;
        productName?: string;
        category?: string;
        value?: number;
        path?: string;
        referrer?: string;
      }
    ) => {
      const windowMs = THROTTLE_MS[event];
      if (windowMs > 0) {
        const key = `${event}:${opts?.productId ?? ""}`;
        const now = Date.now();
        const last = lastSentRef.current.get(key) ?? 0;
        if (now - last < windowMs) return;
        lastSentRef.current.set(key, now);
      }
      try {
        await trackMutation({
          eventId:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `e_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`,
          event,
          sessionId: sessionRef.current || undefined,
          productId: opts?.productId,
          productName: opts?.productName,
          category: opts?.category,
          value: opts?.value,
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
