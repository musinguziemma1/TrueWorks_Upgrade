"use client";

import Link from "next/link";
import { DashboardPlaceholder, MediaFrame } from "./media";
import { useHomeMedia } from "./use-home-media";
import { MaskReveal, Reveal } from "./motion";
import { CREDIBILITY_SIGNALS, FREE_DASHBOARD } from "./data";

export function FreeResourceSection() {
  const { freeDashboard } = useHomeMedia();
  return (
    <section id="free-resource" className="ng-section" aria-labelledby="free-heading">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <p className="ng-eyebrow">Free resource</p>
          <h2 id="free-heading" className="ng-heading">Start with something free.</h2>
          <p className="mt-5 max-w-lg leading-relaxed text-slate-600">{FREE_DASHBOARD.description}</p>
          <dl className="mt-8 grid grid-cols-2 gap-4">
            {FREE_DASHBOARD.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-black/10 bg-white p-5">
                <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <kpi.icon className="h-3.5 w-3.5 text-accent-dark" />
                  {kpi.label}
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">{kpi.value}</dd>
                <p className="mt-1 text-xs text-slate-500">{kpi.trend}</p>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate-500">{FREE_DASHBOARD.demoDataNote}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={FREE_DASHBOARD.primaryCta.href}
              className="inline-flex items-center justify-center rounded-xl bg-[#0E1B2C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#16283F]"
            >
              {FREE_DASHBOARD.primaryCta.label}
            </Link>
            <Link
              href={FREE_DASHBOARD.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-xl border border-black/15 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-black/35"
            >
              {FREE_DASHBOARD.secondaryCta.label}
            </Link>
          </div>
        </Reveal>
        <MaskReveal>
          <MediaFrame
            src={freeDashboard.src}
            alt={freeDashboard.alt}
            label="free · hospital kpi dashboard"
            fallback={<DashboardPlaceholder variant="overview" />}
          />
        </MaskReveal>
      </div>
    </section>
  );
}

export function CredibilitySection() {
  return (
    <section aria-labelledby="credibility-heading" className="border-y border-black/10 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 id="credibility-heading" className="font-heading text-2xl font-semibold sm:text-3xl">
            What every TrueWorks system includes
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIBILITY_SIGNALS.map((signal, index) => (
            <Reveal key={signal.title} delay={0.05 * index}>
              <signal.icon className="h-5 w-5 text-accent-dark" />
              <p className="mt-4 font-heading font-semibold">{signal.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{signal.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
