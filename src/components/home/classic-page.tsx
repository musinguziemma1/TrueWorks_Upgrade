
import dynamic from "next/dynamic";
import Hero from "@/components/home/hero";
import TrustedBy from "@/components/home/trusted-by";
import StatsBand from "@/components/home/stats-band";

// Revalidate the homepage every 5 minutes to improve TTFB


const FeaturedProducts = dynamic(() => import("@/components/home/featured-products"));
const ShopByIndustry = dynamic(() => import("@/components/home/shop-by-industry"));
const WhyTrueWorks = dynamic(() => import("@/components/home/why-trueworks"));
const HowItWorks = dynamic(() => import("@/components/home/how-it-works"));
const ProductShowcase = dynamic(() => import("@/components/home/product-showcase"));
const Testimonials = dynamic(() => import("@/components/home/testimonials"));
const Comparison = dynamic(() => import("@/components/home/comparison"));
const FreeResource = dynamic(() => import("@/components/home/free-resource"));
const FinalCTA = dynamic(() => import("@/components/home/final-cta"));

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
      <StatsBand />
      <FeaturedProducts />
      <ShopByIndustry />
      <HowItWorks />
      <WhyTrueWorks />
      <ProductShowcase />
      <Testimonials />
      <Comparison />
      <FreeResource />
      <FinalCTA />
    </>
  );
}