"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  Eye,
  Heart,
  Building2,
  Users,
  Globe,
  Award,
  Quote,
  Check,
  X,
  ArrowRight,
  Mail,
  MessageCircle,
  Sparkles,
  Compass,
  Lightbulb,
  ShieldCheck,
  Wrench,
  Scale,
  ArrowUpRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CountUp } from "@/components/ui/count-up";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/layout/social-icons";

const milestones = [
  { year: "2018", title: "Founded", description: "TrueWorks Limited was established in Kampala, Uganda with a vision to transform business operations through technology." },
  { year: "2019", title: "First Templates", description: "Launched our first collection of business document templates, serving local enterprises with professional solutions." },
  { year: "2020", title: "Growth", description: "Expanded our team and customer base globally, adding financial modeling and KPI dashboard templates." },
  { year: "2021", title: "Enterprise", description: "Secured enterprise partnerships with major organizations, delivering custom template solutions at scale." },
  { year: "2023", title: "Expansion", description: "Reached 1,000+ customers across 50+ industries, launched new product lines and digital tools." },
  { year: "2025", title: "Looking Ahead", description: "Continuing to innovate with smarter templates, expanded services, and a growing footprint across the continent." },
];

const values = [
  { icon: Target, title: "Our Mission", description: "To design intelligent Business Operating Systems that help organizations simplify operations, improve decision-making, increase accountability, and achieve sustainable growth.", accent: "from-blue-500/15 to-blue-500/0", iconColor: "text-blue-600 dark:text-blue-400" },
  { icon: Eye, title: "Our Vision", description: "To become the world's most trusted Business Operating System company, enabling organizations everywhere to operate with excellence, intelligence, and purpose.", accent: "from-purple-500/15 to-purple-500/0", iconColor: "text-purple-600 dark:text-purple-400" },
  { icon: Heart, title: "Our Values", description: "Truth, Excellence, Simplicity, Innovation, Integrity, and Stewardship guide everything we design.", accent: "from-rose-500/15 to-rose-500/0", iconColor: "text-rose-600 dark:text-rose-400" },
];

const brandValues = [
  { title: "Truth", description: "We build systems based on reality, not assumptions. Data is respected, sources are cited, and figures reconcile.", icon: Compass },
  { title: "Excellence", description: "Everything we design reflects world-class quality. Nothing ships until it meets the standard.", icon: Award },
  { title: "Simplicity", description: "Complexity is reduced into clarity. If a user needs a manual to begin, we have not finished designing.", icon: Lightbulb },
  { title: "Innovation", description: "We continually improve how businesses operate, across Excel, web, mobile, and AI.", icon: Sparkles },
  { title: "Integrity", description: "Our systems earn trust because they are transparent and dependable.", icon: ShieldCheck },
  { title: "Stewardship", description: "We create solutions that endure - maintainable, documented, and owned.", icon: Wrench },
];

const founderPhotoUrl = "/images/founder-gerald-muwonge.jpg"

const founder = {
  name: "Gerald Muwonge",
  role: "Founder & CEO",
  image: founderPhotoUrl,
  initials: "GM",
  quote:
    "Every organization - regardless of size or industry - deserves access to professional tools that drive clarity, efficiency and growth.",
};

const team = [
  { name: "Grace Nakato", role: "Chief Operations Officer", initials: "GN" },
  { name: "Daniel Okello", role: "Head of Product", initials: "DO" },
  { name: "Faith Nansubuga", role: "Lead Designer", initials: "FN" },
  { name: "Joseph Wasswa", role: "Head of Engineering", initials: "JW" },
];

const stats = [
  { value: 500, suffix: "+", label: "Templates", icon: Building2 },
  { value: 1000, suffix: "+", label: "Customers", icon: Users },
  { value: 50, suffix: "+", label: "Industries", icon: Globe },
  { value: 99, suffix: "%", label: "Satisfaction", icon: Award },
];

const companyBadges = [
  { label: "Registered in Uganda", icon: Scale },
  { label: "ISO-aligned processes", icon: ShieldCheck },
  { label: "Remote-first team", icon: Globe },
];

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AboutContent() {
  return (
    <>
      {/* Hero */}
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/[0.10] blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/[0.05] blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  About TrueWorks
                </div>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                  We exist to build{" "}
                  <span className="text-gradient-gold">better</span>{" "}
                  organizations.
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                  TrueWorks Limited is a Ugandan business technology company
                  helping organizations streamline operations, improve
                  decision-making and achieve sustainable growth through
                  expertly crafted templates, dashboards and digital tools.
                </p>
              </FadeIn>
              <FadeIn delay={0.24}>
                <div className="mt-7 flex flex-wrap gap-2">
                  {companyBadges.map((b) => (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur"
                    >
                      <b.icon className="h-3.5 w-3.5 text-accent-light" />
                      {b.label}
                    </span>
                  ))}
                </div>
              </FadeIn>
              <FadeIn delay={0.32}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gradient-gold font-semibold text-primary-dark shadow-lg shadow-accent/30 hover:brightness-105"
                  >
                    <Link href="/store" className="inline-flex items-center">
                      Explore our work
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Link
                    href="/contact"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-white/25 bg-white/[0.04] px-6 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10]"
                  >
                    Get in touch
                  </Link>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2} className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent/25 via-accent/5 to-transparent blur-2xl" aria-hidden />
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/70">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                      Since 2018
                    </span>
                    <span className="text-accent-light">Kampala · UG</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { v: "500+", l: "Templates" },
                      { v: "1,000+", l: "Customers" },
                      { v: "50+", l: "Industries" },
                      { v: "30+", l: "Countries" },
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
                  <div className="mt-4 rounded-xl border border-accent/25 bg-accent/[0.08] p-4">
                    <Quote className="h-5 w-5 text-accent-light" />
                    <p className="mt-2 text-sm italic leading-relaxed text-white/85">
                      &ldquo;Better systems make better organizations. That&apos;s
                      the whole game.&rdquo;
                    </p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-accent-light">
                      Gerald Muwonge · Founder
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Why TrueWorks Exists */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <FadeIn>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                  Why we exist
                </p>
                <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-primary sm:text-4xl">
                  Businesses rarely fail because people lack passion.
                  <br />
                  <span className="text-accent-dark">They fail because they lack systems.</span>
                </h2>
              </FadeIn>
            </div>
            <div className="space-y-5 lg:col-span-7">
              <FadeIn delay={0.1}>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  TrueWorks exists to transform organizations by replacing
                  fragmented processes with integrated Business Operating
                  Systems that create clarity, accountability, scalability, and
                  sustainable growth.
                </p>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  We believe every organization deserves world-class operational
                  systems regardless of size, sector, or stage. Our discipline
                  is to take the operational complexity that quietly erodes
                  performance and resolve it into instruments that are simple
                  to run, honest in what they measure, and built to endure.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4">
                  {[
                    "World-class quality",
                    "Built to endure",
                    "Honest measurement",
                  ].map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3.5 w-3.5 text-accent" />
                      </span>
                      {t}
                    </span>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="bg-surface py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-elevated">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} aria-hidden />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent to-[#B8860B] opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                  <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${item.iconColor}`}>
                    <item.icon className="h-6 w-6" />
                  </span>
                  <h2 className="relative mt-6 font-heading text-xl font-semibold text-primary">
                    {item.title}
                  </h2>
                  <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              What We Stand For
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              Our Core Values
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Six principles that shape every product we build and every decision we make.
            </p>
          </FadeIn>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brandValues.map((v, i) => (
              <FadeIn key={v.title} delay={i * 0.06}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-elevated">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/0 via-accent to-accent/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-accent shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/20">
                      <v.icon className="h-5 w-5" />
                    </span>
                    <span className="font-heading text-3xl font-bold text-muted/30 transition-colors group-hover:text-accent/40">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold text-primary">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Personality */}
      <section className="bg-surface py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              Brand Personality
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              Who We Are
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <FadeIn>
              <div className="h-full rounded-2xl border border-border/70 bg-white p-8 shadow-card">
                <h3 className="flex items-center gap-2.5 font-heading text-xl font-semibold text-primary">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3.5 w-3.5 text-accent" />
                  </span>
                  TrueWorks Is
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {["Professional", "Efficient", "Accessible", "Trustworthy", "Global"].map((trait) => (
                    <li key={trait} className="flex items-center gap-3 rounded-lg bg-surface/60 px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3.5 w-3.5 text-accent" />
                      </span>
                      {trait}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="h-full rounded-2xl border border-border/70 bg-white p-8 shadow-card">
                <h3 className="flex items-center gap-2.5 font-heading text-xl font-semibold text-primary">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-error/10">
                    <X className="h-3.5 w-3.5 text-error" />
                  </span>
                  TrueWorks Is Never
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {[
                    { label: "Corporate / Stuffy", desc: "We are professional, not pretentious." },
                    { label: "Complicated / Confusing", desc: "We make complexity simple." },
                    { label: "Exclusive / Elitist", desc: "We design for every organization." },
                    { label: "Inaccessible / Irrelevant", desc: "Our solutions meet you where you are." },
                  ].map((trait) => (
                    <li key={trait.label} className="flex items-start gap-3 rounded-lg bg-error/[0.03] px-3.5 py-2.5 transition-colors hover:bg-error/5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error/10">
                        <X className="h-3.5 w-3.5 text-error" />
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{trait.label}</span>
                        <span className="ml-2 text-sm text-muted">{trait.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.2}>
            <div className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-white to-accent/[0.06] p-8 text-center shadow-card sm:p-10">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                Our Voice
              </p>
              <p className="mt-3 font-heading text-2xl font-semibold text-primary">
                Clear, Confident, Direct, Human
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
                We speak in plain English, without jargon. We use simple, purposeful language
                that&apos;s modest but ambitious. Every word we write is helpful and actionable.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Founder */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-elevated">
              <div className="grid md:grid-cols-[400px_1fr]">
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary to-primary-dark md:aspect-auto md:min-h-[480px]">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center p-10 sm:p-12 lg:p-14">
                  <Quote className="h-9 w-9 text-accent" />
                  <blockquote className="mt-6 font-heading text-xl leading-relaxed text-primary sm:text-2xl lg:text-3xl">
                    &ldquo;{founder.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary font-heading font-semibold text-accent">
                        {founder.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-semibold text-primary">{founder.name}</p>
                      <p className="text-sm text-muted">{founder.role}</p>
                    </div>
                  </figcaption>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-surface py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              Our Journey
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              The Milestones That Shaped Us
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              From a bold idea in Kampala to a growing movement across the continent.
            </p>
          </FadeIn>

          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="absolute bottom-0 left-[15px] top-0 w-px bg-gradient-to-b from-accent/60 via-border to-border/30 md:left-1/2 md:-translate-x-px" aria-hidden />
            {milestones.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <FadeIn key={m.year} delay={i * 0.06}>
                  <div className="relative mb-10 last:mb-0 md:mb-14">
                    <div className={`flex items-start gap-6 pl-12 md:gap-0 md:pl-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
                      <div className={`flex-1 ${isLeft ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"}`}>
                        <div className={`group rounded-2xl border border-border/70 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-elevated`}>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold tracking-wider text-accent-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            {m.year}
                          </span>
                          <h3 className="mt-2.5 font-heading text-xl font-semibold text-primary">
                            {m.title}
                          </h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.description}</p>
                        </div>
                      </div>
                      <div className="absolute left-[15px] top-6 -translate-x-1/2 md:relative md:left-auto md:top-auto md:flex md:w-auto md:shrink-0 md:translate-x-0">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-accent bg-white shadow-[0_0_0_4px_rgba(227,188,63,0.15)]">
                          <span className="h-2 w-2 rounded-full bg-accent" />
                        </span>
                      </div>
                      <div className="hidden flex-1 md:block" />
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="gradient-brand relative overflow-hidden py-20">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
              By the Numbers
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-white sm:text-4xl">
              Our Impact So Far
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.1}>
                <div className="group flex h-full flex-col items-center rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-white/[0.08]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/25 transition-transform duration-300 group-hover:scale-110">
                    <s.icon className="h-6 w-6 text-accent" />
                  </span>
                  <span className="mt-5 font-heading text-4xl font-semibold tracking-tight text-white">
                    <CountUp end={s.value} suffix={s.suffix} />
                  </span>
                  <span className="mt-1.5 text-sm text-white/55">{s.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-surface py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              The Team
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              The People Behind TrueWorks
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              A small, senior team committed to building better organizations.
            </p>
          </FadeIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <FadeIn key={member.name} delay={i * 0.06}>
                <div className="group flex h-full flex-col items-center rounded-2xl border border-border/70 bg-white p-8 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-elevated">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-4 ring-accent/15 transition-all duration-300 group-hover:ring-accent/30">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light font-heading text-xl font-semibold text-accent">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary">
                      <Mail className="h-3 w-3 text-accent" />
                    </span>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold text-primary">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                  <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4">
                    <a
                      href={`mailto:hello@trueworksgroup.com?subject=Message%20for%20${encodeURIComponent(member.name)}`}
                      aria-label={`Email ${member.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted-foreground transition-all hover:scale-110 hover:bg-primary hover:text-accent"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/256773728944?text=Hello%2C%20I%27d%20like%20to%20chat%20with%20${encodeURIComponent(member.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp ${member.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted-foreground transition-all hover:scale-110 hover:bg-primary hover:text-accent"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href="#"
                      aria-label={`${member.name} on LinkedIn`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted-foreground transition-all hover:scale-110 hover:bg-primary hover:text-accent"
                    >
                      <SocialIcon iconKey="linkedin" className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3} className="mt-10 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Want to work with us? See open roles
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-white pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="gradient-brand relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16 lg:py-20">
              <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />
              <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />
              <div className="relative mx-auto max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
                  Let&apos;s Build Together
                </p>
                <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  Join Us in Building Better Organizations
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70">
                  Explore our templates, download a free resource, or reach out and
                  let&apos;s talk about the systems your organization runs on.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href="/store">
                    <Button
                      size="lg"
                      className="gradient-gold h-auto px-8 py-4 text-sm font-semibold text-primary-dark shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-105"
                    >
                      Browse Templates
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-auto border-white/25 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-white/10"
                    >
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
