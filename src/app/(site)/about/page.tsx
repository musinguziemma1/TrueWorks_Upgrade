import type { Metadata } from "next";
import AboutContent from "./content";

// Static page - cache for 1 hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Us - Building Better Organizations",
  description:
    "TrueWorks Ventures is a Ugandan business technology company helping organizations streamline operations and grow with expertly crafted templates, dashboards and digital tools.",
  keywords: [
    "About TrueWorks",
    "business technology company",
    "Uganda technology",
    "organization templates",
    "business operating systems",
  ],
  openGraph: {
    title: "About Us - TrueWorks Ventures",
    description:
      "TrueWorks Ventures helping organizations streamline operations and grow with expertly crafted templates and digital tools.",
    url: "https://trueworksgroup.com/about",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "About TrueWorks Ventures" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - TrueWorks Ventures",
    description: "Helping organizations streamline operations with expertly crafted templates.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com/about",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
