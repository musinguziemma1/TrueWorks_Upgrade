import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueWorks Limited - Business Operating Systems for Global organizations",
    description:
      "Premium Excel templates, financial models, and dashboards for hospitals, NGOs, churches, schools, and growing businesses across the Globe.",
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
      <body className="font-body min-h-full flex flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ClerkProvider>
          <TooltipProvider>
            <Providers>{children}</Providers>
          </TooltipProvider>
        </ClerkProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
