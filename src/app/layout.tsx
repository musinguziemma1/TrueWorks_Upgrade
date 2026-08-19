import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkipNav } from "@/components/layout/skip-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trueworksgroup.com"),
  title: {
    default: "TrueWorks Limited - Business Operating Systems for Global organizations",
    template: "%s | TrueWorks Limited",
  },
  description:
    "We build Business Operating Systems that help organizations operate better, decide faster, and grow stronger. Premium Excel templates, financial models, and dashboards for hospitals, NGOs, churches, schools, and growing businesses across the Globe.",
  keywords: [
    "Business Operating Systems",
    "Excel templates",
    "financial models",
    "KPI dashboards",
    "hospital management",
    "NGO systems",
    "business automation",
    "Uganda",
    "Global",
    "TrueWorks",
  ],
  openGraph: {
    type: "website",
    siteName: "TrueWorks Limited",
    title: "TrueWorks Limited - Business Operating Systems for Global organizations",
    description:
      "We build Business Operating Systems that help organizations operate better, decide faster, and grow stronger. Premium Excel templates, dashboards and business systems for Global organizations.",
    url: "https://trueworksgroup.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TrueWorks Limited - Business Operating Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueWorks Limited - Business Operating Systems for Global organizations",
    description:
      "Premium Excel templates, financial models, and dashboards for hospitals, NGOs, churches, schools, and growing businesses across the Globe.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TrueWorks Limited",
  url: "https://trueworksgroup.com",
  logo: "https://trueworksgroup.com/images/logo-horizontal.svg",
  description:
    "We build Business Operating Systems that help organizations operate better, decide faster, and grow stronger.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kampala",
    addressCountry: "UG",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@trueworksgroup.com",
    contactType: "customer service",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <head>
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://disciplined-clownfish-256.convex.cloud"}
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-body min-h-full flex flex-col antialiased">
        <SkipNav />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <TooltipProvider>
          <Providers>{children}</Providers>
        </TooltipProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
