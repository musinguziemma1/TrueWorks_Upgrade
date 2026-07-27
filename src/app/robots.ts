import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksug.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/api", "/checkout", "/cart", "/order-confirmation"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
