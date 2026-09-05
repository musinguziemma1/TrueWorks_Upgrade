"use client";

import { Download, BadgeCheck, ShieldCheck, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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

const features = [
  {
    icon: Download,
    title: "Instant download",
    description:
      "Access your templates immediately after purchase - no waiting, no shipping, no subscriptions.",
    accent: {
      tint: "from-blue-500/15 to-blue-500/0",
      iconText: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/20",
    },
  },
  {
    icon: BadgeCheck,
    title: "Built by professionals",
    description:
      "Every template is crafted by finance professionals, data analysts and business consultants.",
    accent: {
      tint: "from-amber-500/15 to-amber-500/0",
      iconText: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
    },
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    description:
      "Pay safely with MTN Mobile Money, Airtel Money, Visa or Mastercard through encrypted checkout.",
    accent: {
      tint: "from-emerald-500/15 to-emerald-500/0",
      iconText: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
    },
  },
  {
    icon: RefreshCw,
    title: "14-day guarantee",
    description:
      "If a template doesn't fit your needs, we'll make it right or refund you - no questions asked.",
    accent: {
      tint: "from-purple-500/15 to-purple-500/0",
      iconText: "text-purple-600 dark:text-purple-400",
      ring: "ring-purple-500/20",
    },
  },
];

export default function WhyTrueWorks() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Why TrueWorks
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Professional tools, zero friction
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Built for teams that want to move fast without sacrificing quality or
            trust. Every detail is engineered to disappear in the background.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated">
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${feature.accent.tint}`}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ring-1 ${feature.accent.ring} ${feature.accent.iconText} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <span className="font-heading text-3xl font-bold text-muted/30 transition-colors group-hover:text-accent/40">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="relative mt-5 font-heading text-lg font-semibold text-primary">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="mt-12">
          <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-white to-accent/[0.06] p-6 shadow-card sm:p-8">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" aria-hidden />
            <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-base font-semibold text-primary">
                    Not sure where to start?
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Book a 15-minute walkthrough and we&apos;ll recommend the right
                    system for your team.
                  </p>
                </div>
              </div>
              <a
                href="/contact"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow"
              >
                Book a walkthrough
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
