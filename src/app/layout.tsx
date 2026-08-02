import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://trueworksug.com"),
  title: {
    default: "TrueWorks Limited - Business Operating Systems for African Organizations",
    template: "%s | TrueWorks Limited",
  },
  description:
    "We build Business Operating Systems that help organizations operate better, decide faster, and grow stronger. Premium Excel templates, financial models, and dashboards for hospitals, NGOs, churches, schools, and growing businesses across Africa.",
  keywords: [
    "Business Operating Systems",
    "Excel templates",
    "financial models",
    "KPI dashboards",
    "hospital management",
    "NGO systems",
    "business automation",
    "Uganda",
    "Africa",
    "TrueWorks",
  ],
  openGraph: {
    type: "website",
    siteName: "TrueWorks Limited",
    title: "TrueWorks Limited - Business Operating Systems for African Organizations",
    description:
      "We build Business Operating Systems that help organizations operate better, decide faster, and grow stronger. Premium Excel templates, dashboards and business systems for African organizations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueWorks Limited - Business Operating Systems for African Organizations",
    description:
      "Premium Excel templates, financial models, and dashboards for hospitals, NGOs, churches, schools, and growing businesses across Africa.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TrueWorks Limited",
  url: "https://trueworksug.com",
  logo: "https://trueworksug.com/images/logo-horizontal.svg",
  description:
    "We build Business Operating Systems that help organizations operate better, decide faster, and grow stronger.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kampala",
    addressCountry: "UG",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@trueworksug.com",
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
      </body>
    </html>
  );
}
