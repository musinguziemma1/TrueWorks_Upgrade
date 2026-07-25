import type { NextConfig } from "next";

const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";

const nextConfig: NextConfig = {
  async rewrites() {
    if (!convexSiteUrl) return [];
    return [
      {
        source: "/api/checkout",
        destination: `${convexSiteUrl}/checkout`,
      },
      {
        source: "/api/pesapal/:path*",
        destination: `${convexSiteUrl}/pesapal/:path*`,
      },
      {
        source: "/api/stripe/:path*",
        destination: `${convexSiteUrl}/stripe/:path*`,
      },
    ];
  },
};

export default nextConfig;
