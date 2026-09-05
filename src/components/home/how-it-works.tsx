"use client";

import { motion } from "framer-motion";
import { Search, Download, Rocket, Check } from "lucide-react";

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

const steps = [
  {
    icon: Search,
    eyebrow: "Step 1",
    title: "Browse the library",
    description:
      "Filter by sector, role or workflow. Every template is described in plain English - no jargon.",
    accent: {
      tint: "from-blue-500/12 to-blue-500/0",
      iconText: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/20",
    },
  },
  {
    icon: Download,
    eyebrow: "Step 2",
    title: "Download instantly",
    description:
      "Pay once with Mobile Money, Airtel Money, Visa or Mastercard. The file is yours forever - no subscription.",
    accent: {
      tint: "from-amber-500/12 to-amber-500/0",
      iconText: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
    },
  },
  {
    icon: Rocket,
    eyebrow: "Step 3",
    title: "Deploy the same day",
    description:
      "Open in Excel or Google Sheets, follow the included quick-start guide, and your team is live by close of business.",
    accent: {
      tint: "from-emerald-500/12 to-emerald-500/0",
      iconText: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
    },
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            How it works
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            From browse to live in three steps
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            No long onboarding. No consultants. No surprises. Pick a system,
            pay once, run it today.
          </p>
        </FadeIn>

        <div className="relative">
          {/* Connector line (desktop only) */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block"
            aria-hidden
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.1}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-white hover:shadow-elevated">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${step.accent.tint}`}
                    aria-hidden
                  />
                  <div className="relative flex items-center gap-3">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ${step.accent.ring} ${step.accent.iconText} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <step.icon className="h-6 w-6" />
                    </span>
                    <span className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {step.eyebrow}
                    </span>
                  </div>
                  <h3 className="relative mt-5 font-heading text-lg font-semibold text-primary">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  <div className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 text-[11px] font-semibold text-accent-dark">
                    <Check className="h-3 w-3" />
                    No subscription
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
