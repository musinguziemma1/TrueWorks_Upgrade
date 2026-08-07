"use client";

import { useEffect, useRef } from "react";

interface TawkToProps {
  propertyId?: string;
  widgetId?: string;
}

/**
 * Tawk.to live chat widget integration.
 * Uses the same injection pattern as the official Tawk.to embed script.
 */
export function LiveChat({ propertyId, widgetId }: TawkToProps) {
  const loaded = useRef(false);

  const TAWK_PROPERTY_ID = propertyId ?? process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID ?? "6a7618b0c010c21d4b631999";
  const TAWK_WIDGET_ID = widgetId ?? process.env.NEXT_PUBLIC_TAWK_WIDGET_ID ?? "1jvel0slm";

  useEffect(() => {
    if (!TAWK_PROPERTY_ID || !TAWK_WIDGET_ID) return;
    if (loaded.current) return;
    loaded.current = true;

    // Use the exact same injection pattern as the official Tawk.to embed script
    // @ts-expect-error Tawk API global
    window.Tawk_API = window.Tawk_API || {};
    // @ts-expect-error Tawk API global
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    }
  }, [TAWK_PROPERTY_ID, TAWK_WIDGET_ID]);

  return null;
}
