"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DashboardPlaceholder, MediaFrame } from "./media";
import { Reveal } from "./motion";
import { DEMO_STAGES, WORKFLOW_STEPS, WHY_FEATURES } from "./data";

export function DemoSection() {
  return (
    <section id="in-action" className="ng-section" aria-labelledby="demo-heading">
      <Reveal>
        <p className="ng-eyebrow">See the system in action</p>
        <h2 id="demo-heading" className="ng-heading">
          From raw data
          <br />
          to decisions.
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {DEMO_STAGES.map((stage) => (
            <li key={stage.step} className="border-t-2 border-accent/50 pt-4">
              <p className="font-heading text-sm font-semibold text-accent-dark">{stage.step}</p>
              <p className="mt-1 font-heading text-lg">{stage.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{stage.detail}</p>
            </li>
          ))}
        </ol>
      </Reveal>
      <Reveal delay={0.15}>
        <MediaFrame
          src="/images/system-in-action.webp"
          alt="TrueWorks dashboard moving from raw ledger data through calculations to KPIs and a management summary"
          ratio="aspect-[16/10] lg:aspect-[21/9]"
          sizes="(min-width: 1280px) 1180px, 100vw"
          label="data · intelligence · decision"
          fallback={<DashboardPlaceholder variant="overview" />}
        />
      </Reveal>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="ng-section" aria-labelledby="workflow-heading">
      <Reveal>
        <h2 id="workflow-heading" className="ng-heading">
          Three steps. Running today.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {WORKFLOW_STEPS.map((step) => (
          <Reveal key={step.number} delay={0.08 * WORKFLOW_STEPS.indexOf(step)}>
            <div className="border-t border-black/10 pt-6">
              <p className="font-heading text-5xl font-semibold text-black/10">{step.number}</p>
              <p className="mt-4 font-heading text-xl font-semibold">{step.title}</p>
              <p className="mt-2 leading-relaxed text-slate-600">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function WhyTrueWorks() {
  return (
    <section id="why-trueworks" className="ng-section" aria-labelledby="why-heading">
      <Reveal>
        <h2 id="why-heading" className="ng-heading max-w-3xl">
          Professional systems. Without the traditional complexity.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={0.06 * index}>
            <div className="group h-full rounded-2xl border border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_30px_60px_-45px_rgba(4,16,31,0.45)]">
              <feature.icon className="h-6 w-6 text-accent-dark" />
              <p className="mt-5 font-heading text-lg font-semibold">{feature.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              <p className="mt-4 border-t border-dashed border-black/10 pt-3 text-xs uppercase tracking-[0.14em] text-slate-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                {feature.meta}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section id="get-started" className="relative overflow-hidden bg-[#04101F] py-20 text-white sm:py-28" aria-labelledby="cta-heading">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 40%, black 10%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 10%, transparent 72%)",
        }}
      />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 id="cta-heading" className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Build a better-run organization.
        </h2>
        <p className="mt-5 text-lg text-white/65">Find the system your team needs and start using it today.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/store"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent-light to-accent-dark px-6 py-4 text-sm font-semibold text-[#071A33] shadow-[0_20px_50px_-22px_rgba(218,165,32,0.85)] transition-all hover:brightness-105"
          >
            Explore Business Systems
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:border-white/30 hover:bg-white/[0.08]"
          >
            Talk to TrueWorks
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
