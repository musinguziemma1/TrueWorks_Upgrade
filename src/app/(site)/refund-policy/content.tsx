"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Download,
} from "lucide-react";

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

const summary = [
  {
    icon: Clock,
    title: "7-day Window",
    description: "Request a refund within 7 days of purchase.",
  },
  {
    icon: RefreshCw,
    title: "Full or Partial",
    description: "We refund the full purchase price — no questions asked.",
  },
  {
    icon: CreditCard,
    title: "5–10 Business Days",
    description: "Refunds appear on your statement within 5–10 business days.",
  },
];

const eligible = [
  "Technical issues we cannot resolve within a reasonable timeframe",
  "Product does not match the description on the product page",
  "You accidentally purchased the same template twice",
  "The download link is broken or the file is corrupt",
];

const notEligible = [
  "You simply changed your mind after downloading the files",
  "You purchased the wrong template for your use case (we encourage contacting us first)",
  "Refund request submitted more than 7 days after purchase",
  "Product has been used in published reports or distributed internally",
];

const process = [
  { step: "1", title: "Email Us", description: "Send your order number and reason to hello@trueworksgroup.com within 7 days of purchase." },
  { step: "2", title: "We Review", description: "Our team reviews your request within 1 business day and confirms eligibility." },
  { step: "3", title: "Refund Issued", description: "Approved refunds are returned to your original payment method within 5–10 business days." },
];

export default function RefundPolicyContent() {
  return (
    <>
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-light backdrop-blur-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Refund Policy
          </span>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">
            7-day Satisfaction Guarantee
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/75">
            We stand behind every template. If something isn&apos;t right, we&apos;ll make it right.
          </p>
          <p className="mt-3 text-xs text-white/50">Last updated: July 1, 2026</p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <FadeIn>
            <div className="grid gap-5 sm:grid-cols-3">
              {summary.map((s) => (
                <div key={s.title} className="rounded-2xl border border-border/70 bg-surface p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-semibold text-primary">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{s.description}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-heading text-2xl font-semibold text-primary sm:text-3xl">Eligibility</h2>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className="mt-6 rounded-2xl border border-border/70 bg-white p-7">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="font-heading text-lg font-semibold text-primary">Eligible for refund</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {eligible.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-5 rounded-2xl border border-border/70 bg-white p-7">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <h3 className="font-heading text-lg font-semibold text-primary">Not eligible</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {notEligible.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-heading text-2xl font-semibold text-primary sm:text-3xl">How to request a refund</h2>
          </FadeIn>
          <FadeIn delay={0.05}>
            <ol className="mt-8 space-y-6">
              {process.map((p) => (
                <li key={p.step} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
                    {p.step}
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-primary">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-2xl border border-border/70 bg-white p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                <Mail className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-primary">Ready to request a refund?</h3>
              <p className="mt-2 text-sm text-muted">
                Email <a href="mailto:hello@trueworksgroup.com" className="font-semibold text-primary underline">hello@trueworksgroup.com</a> with your order number.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 rounded-lg gradient-gold px-6 py-2.5 text-sm font-semibold text-primary-dark shadow-md hover:brightness-105"
                >
                  <Download className="h-4 w-4" />
                  View My Orders
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
