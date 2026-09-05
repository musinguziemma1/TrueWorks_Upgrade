"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Download, BadgeCheck, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const inclusions = [
  "Hospital KPI Dashboard",
  "NGO Grant Tracker",
  "School Fee Manager",
  "SME Cash-Flow Planner",
  "12-month update license",
];

export default function FeaturedBundle() {
  return (
    <section className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="gradient-brand relative overflow-hidden rounded-3xl shadow-elevated">
            <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />

            <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
              {/* Left: copy */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  Featured bundle
                </span>
                <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  The Operations Starter Kit
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
                  Everything a new manager needs to run finance, operations,
                  and reporting on day one. Four flagship systems, one
                  one-time payment, lifetime access.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {inclusions.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm font-medium text-white/90"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent-light">
                        <BadgeCheck className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-baseline gap-3">
                  <span className="font-heading text-4xl font-bold text-white">
                    $149
                  </span>
                  <span className="text-sm text-white/55 line-through">
                    $236
                  </span>
                  <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-light">
                    Save 37%
                  </span>
                </div>

                <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <Button
                    size="lg"
                    className="h-auto gradient-gold px-7 py-3.5 text-sm font-semibold text-primary-dark shadow-lg shadow-accent/25 hover:brightness-105"
                  >
                    <Link
                      href="/store"
                      className="inline-flex items-center gap-2"
                    >
                      Get the bundle
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Link
                    href="/store"
                    className="text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
                  >
                    See individual prices
                  </Link>
                </div>
              </div>

              {/* Right: stat card */}
              <FadeIn delay={0.15} className="w-full">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-sm font-semibold text-white">
                      What you get
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-light">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      4.9 average
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { v: "4", l: "Flagship systems" },
                      { v: "120+", l: "Live formulas" },
                      { v: "10", l: "Chart types" },
                      { v: "∞", l: "Lifetime updates" },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                      >
                        <p className="font-heading text-2xl font-semibold text-white">
                          {m.v}
                        </p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/55">
                          {m.l}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent-light">
                    <Download className="h-4 w-4 shrink-0" />
                    <span>
                      Average customer installs all four systems in under 2
                      hours.
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-white/55">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    14-day money-back guarantee
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
