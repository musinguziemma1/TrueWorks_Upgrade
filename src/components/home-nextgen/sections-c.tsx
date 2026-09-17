"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DashboardPlaceholder, MediaFrame } from "./media";
import { useHomeMedia } from "./use-home-media";
import { Reveal } from "./motion";
import { IMPACT_METRICS, INDUSTRIES } from "./data";

export function ImpactSection() {
  return (
    <section id="impact" className="bg-[#04101F] py-20 text-white sm:py-28" aria-labelledby="impact-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 id="impact-heading" className="font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Less spreadsheet chaos.
            <br />
            <span className="text-white/55">More operational clarity.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT_METRICS.map((metric, index) => (
            <Reveal key={metric.label} delay={0.05 * index}>
              <div className="h-full bg-[#071A33] p-7">
                <p className="font-heading text-4xl font-semibold text-accent-light">
                  {metric.direction === "up" ? "↑" : "↓"}
                </p>
                <p className="mt-4 font-heading text-lg font-semibold text-white">{metric.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{metric.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/40">
          Directional outcomes of moving from manual spreadsheets to documented systems — not customer statistics.
        </p>
      </div>
    </section>
  );
}

export function IndustrySection() {
  const { industries: industryMedia } = useHomeMedia();
  return (
    <section id="industries" className="ng-section" aria-labelledby="industries-heading">
      <Reveal>
        <h2 id="industries-heading" className="ng-heading">One platform. Different realities.</h2>
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry, index) => (
          <Reveal key={industry.id} delay={0.05 * index} className={index === 0 ? "md:col-span-2" : undefined}>
            <Link
              href={industry.exploreHref}
              className="group block h-full overflow-hidden rounded-2xl border border-black/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-50px_rgba(4,16,31,0.5)]"
            >
              <MediaFrame
                src={industryMedia[index]?.src ?? industry.media.src}
                alt={industryMedia[index]?.alt ?? industry.media.alt}
                chrome={false}
                ratio="aspect-[16/9]"
                sizes="(min-width: 1024px) 560px, 100vw"
                fallback={<DashboardPlaceholder variant="overview" />}
              />
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">{industry.label}</p>
                <p className="mt-3 font-heading text-xl font-semibold leading-snug">{industry.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{industry.description}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                  Explore
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
