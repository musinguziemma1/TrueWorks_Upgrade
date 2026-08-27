import type { Metadata } from "next";
import AboutContent from "./content";

// Static page - cache for 1 hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Us - Building Better Organizations",
  description:
    "TrueWorks Limited is a Ugandan business technology company helping organizations streamline operations and grow with expertly crafted templates, dashboards and digital tools.",
  keywords: [
    "About TrueWorks",
    "business technology company",
    "Uganda technology",
    "organization templates",
    "business operating systems",
  ],
  openGraph: {
    title: "About Us - TrueWorks Limited",
    description:
      "TrueWorks Limited helping organizations streamline operations and grow with expertly crafted templates and digital tools.",
    url: "https://trueworksgroup.com/about",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "About TrueWorks Limited" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - TrueWorks Limited",
    description: "Helping organizations streamline operations with expertly crafted templates.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com/about",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
