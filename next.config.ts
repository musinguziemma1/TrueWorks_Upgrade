import type { NextConfig } from "next";

const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";
const convexCloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

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

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
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
