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
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://cdn.clerk.com https://clerk.trueworksgroup.com https://va.vercel-scripts.com https://*.vercel-scripts.com https://embed.tawk.to",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.trueworksgroup.com https://embed.tawk.to",
      "img-src 'self' https://img.clerk.com https://images.clerk.dev https://images.unsplash.com https://lh3.googleusercontent.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.trueworksgroup.com https://cdn.clerk.com data: blob: https://embed.tawk.to",
      "font-src 'self' https://fonts.gstatic.com https://fonts.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.trueworksgroup.com https://embed.tawk.to",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://api.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.trueworksgroup.com https://clerk-telemetry.com https://cdn.clerk.com https://api.stripe.com https://ip-api.com https://va.vercel-scripts.com https://*.vercel-scripts.com https://embed.tawk.to wss://*.tawk.to",
      "frame-src https://js.stripe.com https://www.youtube.com https://player.vimeo.com https://www.google.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.trueworksgroup.com https://embed.tawk.to",
      "worker-src 'self' blob: https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.trueworksgroup.com https://cdn.clerk.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
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
