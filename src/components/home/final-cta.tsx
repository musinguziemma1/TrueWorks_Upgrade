"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Download, RefreshCw, MessageCircle, Check, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import NavyBackground from "./navy-background";

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

const assurances = [
  { icon: ShieldCheck, label: "Secure payment" },
  { icon: Download, label: "Instant download" },
  { icon: RefreshCw, label: "14-day guarantee" },
  { icon: MessageCircle, label: "Real human support" },
];

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <NavyBackground intensity="rich" />
      <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-3xl" aria-hidden />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />

      <FadeIn className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-light backdrop-blur">
          <Star className="h-3 w-3" />
          Get started today
        </span>
        <h2 className="mt-5 font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          Ready to build a{" "}
          <span className="text-gradient-gold">better organization?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          Join more than a thousand Global organizations running on TrueWorks
          systems. Pick a template, download in minutes, deploy the same day.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/store">
            <Button
              size="lg"
              className="h-auto gradient-gold px-8 py-4 text-sm font-semibold text-primary-dark shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-105"
            >
              Browse Premium Templates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-auto items-center gap-2 rounded-md border border-white/25 bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-white/10"
          >
            Talk to our team
            <MessageCircle className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/55">
          {assurances.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-accent" />
              {item.label}
            </span>
          ))}
        </div>

        {/* Tiny social proof row */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-xs text-white/50 sm:flex-row sm:gap-5">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
            ))}
            <span className="ml-1.5 font-semibold text-white/80">4.9 / 5</span>
            <span>· from 1,200+ customers</span>
          </div>
          <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            30-day money-back guarantee
          </span>
        </div>
      </FadeIn>
    </section>
  );
}
