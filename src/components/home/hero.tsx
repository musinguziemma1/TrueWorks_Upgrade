"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, TrendingUp, Star, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const kpis = [
  { label: "Bed Occupancy", value: "78%", delta: "+4.2%" },
  { label: "Revenue / Bed", value: "UGX 2.4M", delta: "+11%" },
  { label: "Patients / Day", value: "142", delta: "+9" },
  { label: "Avg. Bill", value: "UGX 85K", delta: "+6%" },
];

const bars = [42, 58, 50, 66, 61, 78, 72, 88];

export default function Hero() {
  return (
    <section className="gradient-brand relative overflow-hidden">
      {/* Texture + glows */}
      <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
      <div className="absolute -top-32 right-[-8%] h-[480px] w-[480px] rounded-full bg-accent/[0.07] blur-3xl" aria-hidden />
      <div className="absolute bottom-[-20%] left-[-6%] h-[420px] w-[420px] rounded-full bg-secondary/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <motion.div
          className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Copy */}
          <div className="text-center lg:text-left">
            <motion.p
              variants={itemVariants}
              className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-light"
            >
              <span className="hidden h-px w-8 bg-accent sm:inline-block" aria-hidden />
              Business Operating Systems
            </motion.p>

            <motion.h1
              variants={itemVariants}
              className="mt-5 font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-[4rem]"
            >
              Building <em className="text-gradient-gold not-italic">Better</em>
              <br className="hidden sm:block" /> Organizations
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0"
            >
              Premium Excel templates, financial models, dashboards and business
              systems — purpose-built for hospitals, NGOs, churches, schools and
              growing businesses across Africa.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Link href="/store" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-auto w-full gradient-gold px-7 py-3.5 text-sm font-semibold text-primary-dark shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-105 sm:w-auto"
                >
                  Browse the Store
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/#free-template" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto w-full border-white/25 bg-transparent px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Get a Free Template
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/60 lg:justify-start"
            >
              <span className="flex items-center gap-2">
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </span>
                4.8 average rating
              </span>
              <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden />
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-accent" />
                Instant download
              </span>
              <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent" />
                30-day guarantee
              </span>
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div variants={itemVariants} className="relative hidden lg:block" aria-hidden>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative mx-auto w-full max-w-[520px]"
            >
              {/* Main dashboard card */}
              <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-elevated">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                      Hospital KPI Dashboard
                    </p>
                    <p className="font-heading text-lg font-semibold text-primary">Executive Overview</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    Live
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {kpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border border-border/60 bg-surface px-4 py-3">
                      <p className="text-[11px] text-muted">{kpi.label}</p>
                      <div className="mt-0.5 flex items-baseline justify-between">
                        <span className="font-heading text-base font-bold text-primary">{kpi.value}</span>
                        <span className="text-[10px] font-semibold text-success">{kpi.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                      Monthly Revenue
                    </p>
                    <p className="text-[11px] font-semibold text-success">+18% vs last year</p>
                  </div>
                  <div className="mt-3 flex h-24 items-end gap-2">
                    {bars.map((h, i) => (
                      <div key={i} className="relative flex-1 rounded-t-sm bg-primary/90" style={{ height: `${h}%` }}>
                        {i === bars.length - 1 && (
                          <div className="absolute inset-x-0 top-0 h-full rounded-t-sm gradient-gold opacity-90" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="absolute -right-6 -top-8 flex items-center gap-3 rounded-xl border border-white/10 glass-dark px-4 py-3 shadow-elevated"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold">
                  <TrendingUp className="h-4 w-4 text-primary-dark" />
                </span>
                <div>
                  <p className="text-[11px] text-white/60">Revenue this month</p>
                  <p className="text-sm font-semibold text-white">+18.2%</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                className="absolute -bottom-8 -left-6 flex items-center gap-3 rounded-xl border border-white/10 glass-dark px-4 py-3 shadow-elevated"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Download className="h-4 w-4 text-accent-light" />
                </span>
                <div>
                  <p className="text-[11px] text-white/60">Delivery</p>
                  <p className="text-sm font-semibold text-white">Instant download</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats strip */}
        <motion.dl
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-16 grid grid-cols-2 gap-8 border-t border-white/10 pt-10 sm:grid-cols-4 lg:mt-20"
        >
          {[
            { value: "500+", label: "Premium templates" },
            { value: "1,000+", label: "Organizations served" },
            { value: "8", label: "Industry verticals" },
            { value: "30-day", label: "Money-back guarantee" },
          ].map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-3xl font-semibold text-white">{stat.value}</dd>
              <dd className="mt-1 text-sm text-white/55">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
