"use client";

import { useEffect } from "react";

interface TawkToProps {
  propertyId?: string;
  widgetId?: string;
}

/**
 * Tawk.to live chat widget integration.
 * Configure via NEXT_PUBLIC_TAWK_PROPERTY_ID and NEXT_PUBLIC_TAWK_WIDGET_ID env vars.
 * If not configured, renders nothing.
 */
export function LiveChat({ propertyId, widgetId }: TawkToProps) {
  const TAWK_PROPERTY_ID = propertyId ?? process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID ?? "6a7618b0c010c21d4b631999";
  const TAWK_WIDGET_ID = widgetId ?? process.env.NEXT_PUBLIC_TAWK_WIDGET_ID ?? "1jvel0slm";

  useEffect(() => {
    if (!TAWK_PROPERTY_ID || !TAWK_WIDGET_ID) return;

    // Prevent duplicate loading
    if (document.getElementById("tawk-script")) return;

    const script = document.createElement("script");
    script.id = "tawk-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const el = document.getElementById("tawk-script");
      if (el) el.remove();
      // @ts-expect-error Tawk API global
      if (typeof window !== "undefined" && window.Tawk_API) {
        // @ts-expect-error Tawk API global
        delete window.Tawk_API;
        // @ts-expect-error Tawk API global
        delete window.Tawk_LoadStart;
      }
    };
  }, [TAWK_PROPERTY_ID, TAWK_WIDGET_ID]);

  // Don't render anything — Tawk.to injects its own widget
  return null;
}
