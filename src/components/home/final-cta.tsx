"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
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

const assurances = [
  { icon: ShieldCheck, label: "Secure payment" },
  { icon: Download, label: "Instant download" },
  { icon: RefreshCw, label: "4-day guarantee" },
];

export default function FinalCTA() {
  return (
    <section className="gradient-brand relative overflow-hidden py-20 lg:py-28">
      <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
      <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-3xl" aria-hidden />

      <FadeIn className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
          Get Started Today
        </p>
        <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          Ready to Build a Better Organization?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          Join more than a thousand Global organizations running on TrueWorks
          systems.
        </p>
        <div className="mt-9">
          <Link href="/store">
            <Button
              size="lg"
              className="h-auto gradient-gold px-9 py-4 text-sm font-semibold text-primary-dark shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-105"
            >
              Browse Premium Templates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/55">
          {assurances.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-accent" />
              {item.label}
            </span>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
