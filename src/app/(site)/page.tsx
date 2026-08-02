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
};

export default function HomePage() {
  return (
    <>
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
