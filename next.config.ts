import type { NextConfig } from "next";

const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";
const convexCloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

// Extract the Convex deployment hostname for image optimization
function convexHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "img.clerk.com" },
  { protocol: "https", hostname: "images.clerk.dev" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "*.convex.cloud" },
  { protocol: "https", hostname: "*.convex.site" },
];

const cloudHost = convexHostname(convexCloudUrl);
if (cloudHost) {
  remotePatterns.push({ protocol: "https", hostname: cloudHost });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
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
