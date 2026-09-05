"use client";

import { motion } from "framer-motion";
import { X, Check, Sparkles } from "lucide-react";

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

const rows = [
  {
    feature: "Time to first useful report",
    diy: "2–4 weeks of building",
    us: "Same day",
  },
  {
    feature: "Tested formulas & validations",
    diy: "Often breaks silently",
    us: "Battle-tested by 1,200+ teams",
  },
  {
    feature: "Charts & KPI dashboards",
    diy: "Manual every quarter",
    us: "Drop-in, ready to render",
  },
  {
    feature: "Documentation & quick-start",
    diy: "Whatever's in your head",
    us: "Written guide + video walkthrough",
  },
  {
    feature: "Ongoing updates & improvements",
    diy: "Stays frozen forever",
    us: "Free updates for 12 months",
  },
  {
    feature: "Cost over 3 years",
    diy: "Hidden cost of staff time",
    us: "One-time, predictable",
  },
];

export default function Comparison() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Why not just build it yourself
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            DIY spreadsheets vs TrueWorks
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            A side-by-side look at what you actually get from each path. Most
            teams switch after one quarter of trying to build it in-house.
          </p>
        </FadeIn>

        <FadeIn>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-card">
            {/* Header */}
            <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr]">
              <div className="hidden border-b border-border bg-surface p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:block" />
              <div className="flex items-center justify-center gap-2 border-b border-border bg-surface p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:border-l">
                <X className="h-3.5 w-3.5 text-red-500" />
                DIY spreadsheet
              </div>
              <div className="flex items-center justify-center gap-2 border-b border-border bg-gradient-to-br from-accent/10 to-accent/0 p-4 text-xs font-semibold uppercase tracking-wider text-accent-dark sm:border-l">
                <Sparkles className="h-3.5 w-3.5" />
                TrueWorks system
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] ${
                  i !== rows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center px-4 py-4 text-sm font-semibold text-foreground sm:bg-surface sm:px-5">
                  {row.feature}
                </div>
                <div className="flex items-start gap-2.5 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:items-center sm:border-l sm:border-t-0">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400 sm:mt-0">
                    <X className="h-3 w-3" />
                  </span>
                  {row.diy}
                </div>
                <div className="flex items-start gap-2.5 border-t border-border bg-gradient-to-br from-accent/[0.04] to-accent/0 px-4 py-4 text-sm font-medium text-foreground sm:items-center sm:border-l sm:border-t-0">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 sm:mt-0">
                    <Check className="h-3 w-3" />
                  </span>
                  {row.us}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
