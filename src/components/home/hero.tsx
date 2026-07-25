"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Download, TrendingUp, Star, ShieldCheck, Zap,
  HeartHandshake, GraduationCap, Building2, LineChart, Activity,
  Users, DollarSign, Church, School, Stethoscope, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const slides = [
  {
    id: "all",
    label: "Business Operating Systems",
    title: (
      <>
        Building <em className="text-gradient-gold not-italic">Better</em>
        <br /> Organizations
      </>
    ),
    description:
      "Premium Excel templates, financial models, dashboards and business systems - purpose-built for hospitals, NGOs, churches, schools and growing businesses across Africa.",
    kpis: [
      { label: "Bed Occupancy", value: "78%", delta: "+4.2%" },
      { label: "Revenue / Bed", value: "UGX 2.4M", delta: "+11%" },
      { label: "Patients / Day", value: "142", delta: "+9" },
      { label: "Avg. Bill", value: "UGX 85K", delta: "+6%" },
    ],
    icon: BarChart3,
    accent: "accent",
    visual: "dashboard",
  },
  {
    id: "healthcare",
    label: "Healthcare Solutions",
    title: (
      <>
        Smarter <em className="text-gradient-gold not-italic">Hospital</em>
        <br /> Operations
      </>
    ),
    description:
      "From patient billing to KPI dashboards, equip your healthcare facility with tools that improve patient outcomes, streamline administration, and drive revenue growth.",
    kpis: [
      { label: "Beds Tracked", value: "500+", delta: "Per facility" },
      { label: "Avg Savings", value: "18%", delta: "reduction" },
      { label: "Departments", value: "12", delta: "per hospital" },
      { label: "Uptime", value: "99.9%", delta: "reliable" },
    ],
    icon: Stethoscope,
    accent: "emerald",
    visual: "healthcare",
  },
  {
    id: "ngo",
    label: "Nonprofit & NGO Tools",
    title: (
      <>
        Amplify Your <em className="text-gradient-gold not-italic">Impact</em>
        <br /> With Data
      </>
    ),
    description:
      "Track grants, manage donor commitments, and produce field-ready reports. Built for NGOs and nonprofits that need clarity, accountability, and scalability.",
    kpis: [
      { label: "Grants Tracked", value: "200+", delta: "per org" },
      { label: "Donors", value: "50+", delta: "per grant" },
      { label: "Report Time", value: "-60%", delta: "faster" },
      { label: "Compliance", value: "98%", delta: "donor-ready" },
    ],
    icon: HeartHandshake,
    accent: "rose",
    visual: "ngo",
  },
  {
    id: "education",
    label: "Schools & Churches",
    title: (
      <>
        Manage <em className="text-gradient-gold not-italic">Faithfully</em>
        <br /> &amp; Efficiently
      </>
    ),
    description:
      "Fee management, student performance tracking, tithe and offering records, membership databases - purpose-built tools for educational and religious institutions.",
    kpis: [
      { label: "Students", value: "2,000+", delta: "per school" },
      { label: "Members", value: "5,000+", delta: "per church" },
      { label: "Fee Collection", value: "96%", delta: "rate" },
      { label: "Reports", value: "Auto", delta: "termly" },
    ],
    icon: GraduationCap,
    accent: "violet",
    visual: "education",
  },
  {
    id: "business",
    label: "SME & Startup Finance",
    title: (
      <>
        Grow With <em className="text-gradient-gold not-italic">Confidence</em>
        <br /> &amp; Clarity
      </>
    ),
    description:
      "Cash flow forecasting, financial modeling, HR trackers, and inventory systems. Everything a growing business needs to operate with discipline and scale sustainably.",
    kpis: [
      { label: "Cash Flow", value: "12-mo", delta: "forecast" },
      { label: "Models", value: "3-stmt", delta: "linked" },
      { label: "Employees", value: "500+", delta: "per org" },
      { label: "ROI", value: "3.2x", delta: "average" },
    ],
    icon: Building2,
    accent: "blue",
    visual: "business",
  },
];

const floatingShapes = [
  { size: "h-16 w-16", positions: "top-[10%] left-[5%]", duration: 7, delay: 0 },
  { size: "h-10 w-10", positions: "top-[60%] left-[3%]", duration: 9, delay: 1 },
  { size: "h-20 w-20", positions: "bottom-[15%] right-[8%]", duration: 8, delay: 2 },
  { size: "h-12 w-12", positions: "top-[20%] right-[4%]", duration: 6, delay: 0.5 },
  { size: "h-8 w-8", positions: "bottom-[40%] right-[15%]", duration: 10, delay: 1.5 },
];

const barData = [42, 58, 50, 66, 61, 78, 72, 88];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  }, [current]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  const Visual = () => {
    if (slide.visual === "dashboard") {
      return (
        <div className="relative w-full max-w-[520px]">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Hospital KPI Dashboard</p>
                  <p className="font-heading text-lg font-semibold text-primary">Executive Overview</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />Live
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {slide.kpis.map((kpi) => (
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
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Monthly Revenue</p>
                  <p className="text-[11px] font-semibold text-success">+18% vs last year</p>
                </div>
                <div className="mt-3 flex h-24 items-end gap-2">
                  {barData.map((h, i) => (
                    <div key={i} className="relative flex-1 rounded-t-sm bg-primary/90" style={{ height: `${h}%` }}>
                      {i === barData.length - 1 && <div className="absolute inset-x-0 top-0 h-full rounded-t-sm gradient-gold opacity-90" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
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
        </div>
      );
    }

    return (
      <div className="relative w-full max-w-[520px]">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-elevated">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <slide.icon className="h-5 w-5 text-accent" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                  {slide.label}
                </p>
                <p className="font-heading text-lg font-semibold text-primary">Performance Overview</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {slide.kpis.map((kpi) => (
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
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Growth Trend</p>
                <p className="text-[11px] font-semibold text-success">+15% this quarter</p>
              </div>
              <div className="mt-3 flex h-24 items-end gap-2">
                {barData.map((h, i) => (
                  <div key={i} className="relative flex-1 rounded-t-sm" style={{ height: `${h}%` }}>
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 h-full rounded-t-sm opacity-90",
                        slide.accent === "emerald" && "bg-emerald-500",
                        slide.accent === "rose" && "bg-rose-500",
                        slide.accent === "violet" && "bg-violet-500",
                        slide.accent === "blue" && "bg-blue-500",
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute -right-6 -top-8 flex items-center gap-3 rounded-xl border border-white/10 glass-dark px-4 py-3 shadow-elevated"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold">
            <Activity className="h-4 w-4 text-primary-dark" />
          </span>
          <div>
            <p className="text-[11px] text-white/60">Real-time</p>
            <p className="text-sm font-semibold text-white">Auto-updates</p>
          </div>
        </motion.div>
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="absolute -bottom-8 -left-6 flex items-center gap-3 rounded-xl border border-white/10 glass-dark px-4 py-3 shadow-elevated"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <Users className="h-4 w-4 text-accent-light" />
          </span>
          <div>
            <p className="text-[11px] text-white/60">Trusted by</p>
            <p className="text-sm font-semibold text-white">1,000+ orgs</p>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <section className="gradient-brand relative overflow-hidden">
      <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />

      {/* Looped background animations */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          aria-hidden
          className={cn(
            "absolute rounded-full border border-white/5 bg-white/[0.03]",
            shape.size,
            shape.positions,
          )}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.08, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      ))}

      <div className="absolute -top-32 right-[-8%] h-[480px] w-[480px] rounded-full bg-accent/[0.07] blur-3xl" aria-hidden />
      <div className="absolute bottom-[-20%] left-[-6%] h-[420px] w-[420px] rounded-full bg-secondary/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12"
          >
            {/* Copy */}
            <div className="text-center lg:text-left">
              <motion.p
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-light"
              >
                <span className="hidden h-px w-8 bg-accent sm:inline-block" aria-hidden />
                {slide.label}
              </motion.p>

              <motion.h1
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="mt-5 font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-[4rem]"
              >
                {slide.title}
              </motion.h1>

              <motion.p
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0"
              >
                {slide.description}
              </motion.p>

              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
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

              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
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
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="relative hidden lg:block"
              aria-hidden
            >
              <Visual />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slide navigation dots */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === current ? "w-8 bg-accent" : "w-1.5 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

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