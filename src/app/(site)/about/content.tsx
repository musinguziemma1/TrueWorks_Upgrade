"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Building2, Users, Globe, Award, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const milestones = [
  { year: "2018", title: "Founded", description: "TrueWorks Limited was established in Kampala, Uganda with a vision to transform business operations through technology." },
  { year: "2019", title: "First Templates", description: "Launched our first collection of business document templates, serving local enterprises with professional solutions." },
  { year: "2020", title: "Growth", description: "Expanded our team and customer base globally, adding financial modeling and KPI dashboard templates." },
  { year: "2021", title: "Enterprise", description: "Secured enterprise partnerships with major organizations, delivering custom template solutions at scale." },
  { year: "2023", title: "Expansion", description: "Reached 1,000+ customers across 50+ industries, launched new product lines and digital tools." },
  { year: "2025", title: "Looking Ahead", description: "Continuing to innovate with smarter templates, expanded services, and a growing footprint across the continent." },
];

const values = [
  { icon: Target, title: "Our Mission", description: "To design intelligent Business Operating Systems that help organizations simplify operations, improve decision-making, increase accountability, and achieve sustainable growth." },
  { icon: Eye, title: "Our Vision", description: "To become the world's most trusted Business Operating System company, enabling organizations everywhere to operate with excellence, intelligence, and purpose." },
  { icon: Heart, title: "Our Values", description: "Truth, Excellence, Simplicity, Innovation, Integrity, and Stewardship guide everything we design." },
];

const brandValues = [
  { title: "Truth", description: "We build systems based on reality, not assumptions. Data is respected, sources are cited, and figures reconcile." },
  { title: "Excellence", description: "Everything we design reflects world-class quality. Nothing ships until it meets the standard." },
  { title: "Simplicity", description: "Complexity is reduced into clarity. If a user needs a manual to begin, we have not finished designing." },
  { title: "Innovation", description: "We continually improve how businesses operate, across Excel, web, mobile, and AI." },
  { title: "Integrity", description: "Our systems earn trust because they are transparent and dependable." },
  { title: "Stewardship", description: "We create solutions that endure - maintainable, documented, and owned." },
];

const founderPhotoUrl = "https://laudable-ptarmigan-104.convex.cloud/api/storage/0877880f-4e1c-4646-8a02-fbff3abf03dc"

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
  { value: "500+", label: "Templates", icon: Building2 },
  { value: "1,000+", label: "Customers", icon: Users },
  { value: "50+", label: "Industries", icon: Globe },
  { value: "99%", label: "Satisfaction", icon: Award },
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
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/[0.08] blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center lg:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
              About TrueWorks
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">
              We Exist to Build{" "}
              <em className="text-gradient-gold not-italic">Better</em>{" "}
              Organizations
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-white/70 sm:text-lg">
              TrueWorks Limited is a Ugandan business technology company helping
              organizations streamline operations, improve decision-making and
              achieve sustainable growth through expertly crafted templates,
              dashboards and digital tools.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Why TrueWorks Exists */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              Why TrueWorks Exists
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              Businesses Rarely Fail Because People Lack Passion.
              <br />
              <em className="not-italic text-accent-dark">They Fail Because They Lack Systems.</em>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted">
              TrueWorks exists to transform organizations by replacing fragmented
              processes with integrated Business Operating Systems that create
              clarity, accountability, scalability, and sustainable growth.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
              We believe every organization deserves world-class operational
              systems regardless of size, sector, or stage. Our discipline is
              to take the operational complexity that quietly erodes performance
              and resolve it into instruments that are simple to run, honest in
              what they measure, and built to endure.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="bg-surface py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="h-full rounded-xl border border-border/70 bg-white p-8 shadow-card transition-shadow duration-300 hover:shadow-elevated">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <item.icon className="h-5 w-5 text-accent" />
                  </span>
                  <h2 className="mt-5 font-heading text-xl font-semibold text-primary">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
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
              <FadeIn key={v.title} delay={i * 0.08}>
                <div className="h-full rounded-xl border border-border/70 bg-surface p-7 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-heading text-lg font-bold text-accent">
                    {v.title[0]}
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-primary">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{v.description}</p>
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
              <div className="rounded-xl border border-border/70 bg-white p-8 shadow-card">
                <h3 className="font-heading text-xl font-semibold text-primary">TrueWorks Is</h3>
                <ul className="mt-5 space-y-3">
                  {["Professional", "Efficient", "Accessible", "Trustworthy", "Global"].map((trait) => (
                    <li key={trait} className="flex items-center gap-3 text-sm text-muted">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <span className="text-xs font-bold text-accent">+</span>
                      </span>
                      {trait}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="rounded-xl border border-border/70 bg-white p-8 shadow-card">
                <h3 className="font-heading text-xl font-semibold text-primary">TrueWorks Is Never</h3>
                <ul className="mt-5 space-y-3">
                  {[
                    { label: "Corporate / Stuffy", desc: "We are professional, not pretentious." },
                    { label: "Complicated / Confusing", desc: "We make complexity simple." },
                    { label: "Exclusive / Elitist", desc: "We design for every organization." },
                    { label: "Inaccessible / Irrelevant", desc: "Our solutions meet you where you are." },
                  ].map((trait) => (
                    <li key={trait.label} className="flex items-start gap-3 text-sm text-muted">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error/10">
                        <span className="text-xs font-bold text-error">x</span>
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{trait.label}</span>
                        <span className="ml-2 text-muted">{trait.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.2}>
            <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-border/70 bg-white p-8 text-center shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                Our Voice
              </p>
              <p className="mt-3 font-heading text-xl font-semibold text-primary">
                Clear, Confident, Direct, Human
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
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

          <div className="relative mx-auto mt-16 max-w-3xl">
            <div className="absolute bottom-0 left-[15px] top-0 w-px bg-border md:left-1/2" aria-hidden />
            {milestones.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <FadeIn key={m.year} delay={i * 0.08}>
                  <div className="relative mb-12 last:mb-0">
                    <div className={`flex items-start gap-6 md:gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
                      <div className={`flex-1 ${isLeft ? "md:pr-14 md:text-right" : "md:pl-14 md:text-left"}`}>
                        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold tracking-wider text-accent-dark">
                          {m.year}
                        </span>
                        <h3 className="mt-2.5 font-heading text-xl font-semibold text-primary">
                          {m.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.description}</p>
                      </div>
                      <div className="relative z-10 shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-white shadow-soft">
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
                <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-sm">
                  <s.icon className="mb-4 h-7 w-7 text-accent" />
                  <span className="font-heading text-4xl font-semibold text-white">{s.value}</span>
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
              <FadeIn key={member.name} delay={i * 0.08}>
                <div className="flex h-full flex-col items-center rounded-xl border border-border/70 bg-white p-8 text-center shadow-card">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary font-heading text-xl font-semibold text-accent">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-5 font-heading text-lg font-semibold text-primary">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{member.role}</p>
                </div>
              </FadeIn>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}
