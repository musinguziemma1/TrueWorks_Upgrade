import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";

/** AI training crawlers are blocked so our catalogue copy is not reused. */
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "Google-Extended",
  "anthropic-ai",
  "ClaudeBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/account",
          "/api",
          "/checkout",
          "/cart",
          "/order-confirmation",
          "/sign-in",
          "/sign-up",
          "/sso-callback",
          "/reset-password",
          "/verify-email",
        ],
      },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
