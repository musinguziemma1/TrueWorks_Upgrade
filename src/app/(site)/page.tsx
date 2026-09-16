import type { Metadata } from "next";
import ClassicHomePage from "@/components/home/classic-page";
import NextGenPage from "@/components/home-nextgen/nextgen-page";
import { getHomepageVariant } from "@/lib/homepage-server";
import { nextgenMetadata } from "@/lib/homepage-metadata";

// Read the published choice on each request, without a stale ISR layout.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return (await getHomepageVariant()) === "nextgen" ? nextgenMetadata : classicMetadata;
}

export default async function HomePage() {
  return (await getHomepageVariant()) === "nextgen" ? <NextGenPage /> : <ClassicHomePage />;
}


const classicMetadata: Metadata = {
  title: "TrueWorks Limited - Business Operating Systems for Global organizations",
  description:
    "Premium Excel templates, financial models, dashboards and business systems - purpose-built for hospitals, NGOs, churches, schools and growing businesses across the Globe. Instant download, mobile money accepted.",
  keywords: [
    "Business Operating Systems",
    "Excel templates",
    "financial models",
    "KPI dashboards",
    "hospital management templates",
    "NGO management tools",
    "church management systems",
    "school administration templates",
    "business automation",
    "downloadable templates",
  ],
  openGraph: {
    title: "TrueWorks Limited - Business Operating Systems for Global organizations",
    description:
      "Premium Excel templates, financial models, dashboards and business systems for hospitals, NGOs, churches, schools and growing businesses across the Globe.",
    url: "https://trueworksgroup.com",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "TrueWorks Limited" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueWorks Limited - Business Operating Systems for Global organizations",
    description: "Premium Excel templates, financial models, dashboards and business systems for hospitals, NGOs, churches, schools and growing businesses.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com",
  },
};

