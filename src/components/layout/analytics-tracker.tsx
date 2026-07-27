"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

const SESSION_KEY = "tw-session-id";
const VISIT_KEY = "tw-visited-date";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Tracks page views (on every route change) and unique visitors
 * (once per day per browser) into the Convex analytics table.
 * Renders nothing.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const incrementPageViews = useMutation(api.analytics.incrementPageViews);
  const incrementVisitors = useMutation(api.analytics.incrementVisitors);
  const lastTracked = useRef<string | null>(null);

  // Unique visitor: once per day per browser
  useEffect(() => {
    try {
      const date = today();
      if (localStorage.getItem(VISIT_KEY) !== date) {
        localStorage.setItem(VISIT_KEY, date);
        incrementVisitors({ date, sessionId: getSessionId() }).catch(() => {});
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Page view: on every route change (skip admin)
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    incrementPageViews({ date: today(), sessionId: getSessionId() }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
