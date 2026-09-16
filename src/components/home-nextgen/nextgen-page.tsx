"use client";

import { MotionConfig } from "framer-motion";
import NextGenNav from "./nextgen-nav";
import NextGenHero from "./hero";
import ProductExplorer from "./product-explorer";
import { ProblemSolution, TrustStrip } from "./sections-a";
import { DemoSection, FinalCta, HowItWorks, WhyTrueWorks } from "./sections-b";
import { ImpactSection, IndustrySection } from "./sections-c";
import { CredibilitySection, FreeResourceSection } from "./sections-d";
import { ScrollProgressBar } from "./motion";

/* -------------------------------------------------------------------------- *
 * Next-generation homepage composition.
 *
 * Copy lives in ./data.ts; sections are data-driven and every animation
 * respects prefers-reduced-motion via the primitives in ./motion.tsx.
 * -------------------------------------------------------------------------- */

export default function NextGenPage() {
  return (
    <MotionConfig reducedMotion="user">
    <div className="ng-home overflow-x-clip bg-[#F7F8FA] text-[#0E1B2C]">
      <ScrollProgressBar />
      <NextGenNav />
      <div>
        <NextGenHero />
        <TrustStrip />
        <ProblemSolution />
        <ProductExplorer />
        <DemoSection />
        <HowItWorks />
        <WhyTrueWorks />
        <ImpactSection />
        <IndustrySection />
        <FreeResourceSection />
        <CredibilitySection />
        <FinalCta />
      </div>
    </div>
    </MotionConfig>
  );
}
