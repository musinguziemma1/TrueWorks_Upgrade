import type { Metadata } from "next";
import ResourcesContent from "./content";

export const metadata: Metadata = {
  title: "Resources - Business Insights & Guides",
  description:
    "Practical guides, insights and resources on financial modeling, KPI dashboards, business planning and operations for Global organizations.",
  keywords: [
    "business guides",
    "financial modeling tips",
    "KPI dashboard guides",
    "business planning resources",
    "operations management",
  ],
  openGraph: {
    title: "Resources - Business Insights & Guides | TrueWorks",
    description:
      "Practical guides, insights and resources on financial modeling, KPI dashboards and business planning.",
    url: "https://trueworksgroup.com/resources",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TrueWorks Resources" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources - Business Insights & Guides | TrueWorks",
    description: "Practical guides and resources on business planning and operations.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com/resources",
  },
};

export default function ResourcesPage() {
  return <ResourcesContent />;
}
