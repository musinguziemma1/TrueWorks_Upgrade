import type { Metadata } from "next";
import Hero from "@/components/home/hero";
import TrustedBy from "@/components/home/trusted-by";
import FeaturedProducts from "@/components/home/featured-products";
import ShopByIndustry from "@/components/home/shop-by-industry";
import WhyTrueWorks from "@/components/home/why-trueworks";
import ProductShowcase from "@/components/home/product-showcase";
import Testimonials from "@/components/home/testimonials";
import FreeResource from "@/components/home/free-resource";
import FinalCTA from "@/components/home/final-cta";

export const metadata: Metadata = {
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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TrueWorks Limited" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueWorks Limited - Business Operating Systems for Global organizations",
    description:
      "Premium Excel templates, financial models, dashboards and business systems for hospitals, NGOs, churches, schools and growing businesses.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com",
  },
};

export default function HomePage() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TrueWorks Limited",
    url: "https://trueworksgroup.com",
    description:
      "Premium Excel templates, financial models, dashboards and business systems for hospitals, NGOs, churches, schools and growing businesses.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://trueworksgroup.com/store?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero />
      <TrustedBy />
      <FeaturedProducts />
      <ShopByIndustry />
      <WhyTrueWorks />
      <ProductShowcase />
      <Testimonials />
      <FreeResource />
      <FinalCTA />
    </>
  );
}
