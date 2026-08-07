"use client";

import Script from "next/script";

/**
 * Tawk.to live chat widget integration.
 * Uses Next.js Script component for optimal loading.
 */
export function LiveChat() {
  const propertyId = "6a7618b0c010c21d4b631999";
  const widgetId = "1jvel0slm";

  if (!propertyId || !widgetId) return null;

  return (
    <Script
      id="tawk-chat"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}
