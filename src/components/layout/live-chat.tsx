"use client";

import Script from "next/script";

/**
 * Tawk.to live chat widget integration.
 * Loads the official Tawk embed script via Next.js Script (afterInteractive)
 * so it only runs after the page hydrates.
 */
export function LiveChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  if (!propertyId || !widgetId) return null;

  return (
    <Script
      id="tawk-chat"
      src={`https://embed.tawk.to/${propertyId}/${widgetId}`}
      strategy="afterInteractive"
    />
  );
}
