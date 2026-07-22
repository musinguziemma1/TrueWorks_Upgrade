import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
    default: "TrueWorks Limited — Premium Business Operating Systems",
    template: "%s | TrueWorks Limited",
  },
  description:
    "Premium Excel templates, financial models, dashboards and business systems built for hospitals, NGOs, churches, schools and growing businesses across Africa.",
  keywords: [
    "business templates",
    "Excel dashboards",
    "financial models",
    "KPI dashboards",
    "Uganda",
    "Africa",
    "TrueWorks",
  ],
  openGraph: {
    type: "website",
    siteName: "TrueWorks Limited",
    title: "TrueWorks Limited — Premium Business Operating Systems",
    description:
      "Premium Excel templates, financial models, dashboards and business systems for hospitals, NGOs, churches, schools and growing businesses.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="font-body min-h-full flex flex-col antialiased">
        <ClerkProvider>
          <TooltipProvider>
            <Providers>{children}</Providers>
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
