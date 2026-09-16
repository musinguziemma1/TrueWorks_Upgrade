"use client";

import { Check, Minus } from "lucide-react";
import { Reveal } from "./motion";
import { SECTORS, TRADITIONAL_APPROACH, TRUEWORKS_APPROACH } from "./data";

export function TrustStrip() {
  const row = [...SECTORS, ...SECTORS];
  return (
    <section id="trusted-by" aria-labelledby="trust-heading" className="border-b border-black/10 bg-white py-12">
      <Reveal>
        <h2 id="trust-heading" className="text-center font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Built for the people who keep organizations moving.
        </h2>
      </Reveal>
      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="ng-marquee-scroll overflow-hidden">
          <ul className="flex w-max items-center gap-10 px-5">
            {row.map((sector, index) => (
              <li
                key={`${sector.name}-${index}`}
                aria-hidden={index >= SECTORS.length}
                className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-slate-600"
              >
                <sector.icon className="h-4 w-4 text-accent" />
                {sector.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ProblemSolution() {
  return (
    <section id="problem-solution" className="ng-section" aria-labelledby="problem-heading">
      <Reveal>
        <h2 id="problem-heading" className="ng-heading max-w-3xl">
          Why spend weeks building what your team needs today?
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-black/10 bg-[#EEF0F3] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">The traditional way</p>
            <ul className="mt-6 space-y-4">
              {TRADITIONAL_APPROACH.map((item) => (
                <li key={item.title} className="flex items-start gap-3 text-slate-600">
                  <Minus className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    <span className="font-medium text-slate-700">{item.title}</span>
                    {item.detail ? <span className="block text-sm text-slate-500">{item.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="h-full rounded-2xl border border-accent/30 bg-white p-8 shadow-[0_30px_80px_-60px_rgba(4,16,31,0.5)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">The TrueWorks way</p>
            <ul className="mt-6 space-y-4">
              {TRUEWORKS_APPROACH.map((item) => (
                <li key={item.title} className="flex items-start gap-3 text-slate-700">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <span className="font-medium">{item.title}</span>
                    {item.detail ? <span className="block text-sm text-slate-500">{item.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
