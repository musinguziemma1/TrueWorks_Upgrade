"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Download, TrendingUp, Star, ShieldCheck, Zap,
  HeartHandshake, GraduationCap, Building2, Activity,
  Users, Stethoscope, BarChart3, Target, Gauge, CheckCircle2, Play,
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
    tagline: "Built for real people. Backed by experience. Focused on results.",
    title: (
      <>
        Smarter Systems.
        <br />
        <span className="text-white/90">Stronger Decisions.</span>
        <br />
        <span className="text-gradient-gold">Better Results.</span>
      </>
    ),
    description:
      "TrueWorks builds practical business operating systems that bring clarity to your numbers and confidence to your decisions.",
    kpis: [
      { label: "Total Revenue", value: "UGX 1.25B", delta: "+12.4%", trend: "up" },
      { label: "Net Profit", value: "UGX 215M", delta: "+18.7%", trend: "up" },
      { label: "Cash Balance", value: "UGX 320M", delta: "+8.2%", trend: "up" },
      { label: "Growth", value: "+15.3%", delta: "vs Last Year", trend: "neutral" },
    ],
    valueProps: [
      { icon: Target, label: "Financial Clarity", desc: "Real-time insights that drive results" },
      { icon: Gauge, label: "Operational Control", desc: "Track what matters and improve what doesn't" },
      { icon: BarChart3, label: "Smart Planning", desc: "Plan ahead with data you can trust" },
      { icon: CheckCircle2, label: "Built For Growth", desc: "Scalable systems for every stage of your journey" },
    ],
    icon: BarChart3,
    accent: "accent",
    visual: "dashboard",
  },
  {
    id: "healthcare",
    label: "Healthcare Solutions",
    tagline: "Trusted by forward-thinking organizations to drive clarity, efficiency and growth.",
    title: (
      <>
        Better Systems.
        <br />
        <span className="text-white/90">Better Decisions.</span>
        <br />
        <span className="text-gradient-gold">Better Results.</span>
      </>
    ),
    description:
      "TrueWorks transforms the way organizations plan, manage, and grow with powerful, intelligent business operating systems.",
    kpis: [
      { label: "Revenue", value: "UGX 1.25B", delta: "+12.1%", trend: "up" },
      { label: "Net Profit", value: "UGX 215M", delta: "+38.7%", trend: "up" },
      { label: "Cash Balance", value: "UGX 320M", delta: "+9.2%", trend: "up" },
      { label: "Growth", value: "+15.3%", delta: "vs Last Year", trend: "neutral" },
    ],
    valueProps: [
      { icon: BarChart3, label: "Plan", desc: "with Confidence" },
      { icon: TrendingUp, label: "Track", desc: "in Real Time" },
      { icon: Activity, label: "Analyze", desc: "with Clarity" },
      { icon: Target, label: "Act", desc: "with Impact" },
    ],
    icon: Stethoscope,
    accent: "emerald",
    visual: "healthcare",
  },
  {
    id: "ngo",
    label: "Nonprofit & NGO Tools",
    tagline: "Trusted by forward-thinking organizations to drive clarity, efficiency and growth.",
    title: (
      <>
        Smarter Systems.
        <br />
        <span className="text-white/90">Stronger Decisions.</span>
        <br />
        <span className="text-gradient-gold">Sustainable Growth.</span>
      </>
    ),
    description:
      "TrueWorks helps organizations plan, track, and manage every part of their operations with intelligent, integrated business systems.",
    kpis: [
      { label: "Revenue", value: "UGX 1.25B", delta: "+21%", trend: "up" },
      { label: "Net Profit", value: "UGX 215M", delta: "+38.7%", trend: "up" },
      { label: "Cash Balance", value: "UGX 320M", delta: "+9.2%", trend: "up" },
      { label: "Growth", value: "+15.3%", delta: "vs Last Year", trend: "neutral" },
    ],
    valueProps: [
      { icon: Target, label: "Plan", desc: "with Confidence" },
      { icon: TrendingUp, label: "Track", desc: "in Real Time" },
      { icon: Activity, label: "Analyze", desc: "with Clarity" },
      { icon: CheckCircle2, label: "Act", desc: "with Impact" },
    ],
    icon: HeartHandshake,
    accent: "rose",
    visual: "ngo",
  },
  {
    id: "education",
    label: "Schools & Churches",
    tagline: "Built for real people. Backed by experience. Focused on results.",
    title: (
      <>
        Better Systems.
        <br />
        <span className="text-white/90">Better Decisions.</span>
        <br />
        <span className="text-gradient-gold">Better Results.</span>
      </>
    ),
    description:
      "TrueWorks transforms the way organizations plan, manage, and grow with powerful, intelligent business operating systems.",
    kpis: [
      { label: "Revenue", value: "UGX 1.25B", delta: "+12.4%", trend: "up" },
      { label: "Net Profit", value: "UGX 215M", delta: "+18.7%", trend: "up" },
      { label: "Cash Balance", value: "UGX 320M", delta: "+8.2%", trend: "up" },
      { label: "Growth", value: "+15.3%", delta: "vs Last Year", trend: "neutral" },
    ],
    valueProps: [
      { icon: BarChart3, label: "Plan", desc: "with Confidence" },
      { icon: TrendingUp, label: "Track", desc: "in Real Time" },
      { icon: Activity, label: "Analyze", desc: "with Clarity" },
      { icon: Target, label: "Act", desc: "with Impact" },
    ],
    icon: GraduationCap,
    accent: "violet",
    visual: "education",
  },
  {
    id: "business",
    label: "SME & Startup Finance",
    tagline: "Trusted by forward-thinking organizations to drive clarity, efficiency and growth.",
    title: (
      <>
        Smarter Systems.
        <br />
        <span className="text-white/90">Stronger Decisions.</span>
        <br />
        <span className="text-gradient-gold">Sustainable Growth.</span>
      </>
    ),
    description:
      "TrueWorks helps organizations plan, track, and manage every part of their operations with intelligent, integrated business systems.",
    kpis: [
      { label: "Revenue", value: "UGX 1.25B", delta: "+21%", trend: "up" },
      { label: "Net Profit", value: "UGX 215M", delta: "+38.7%", trend: "up" },
      { label: "Cash Balance", value: "UGX 320M", delta: "+9.2%", trend: "up" },
      { label: "Growth", value: "+15.3%", delta: "vs Last Year", trend: "neutral" },
    ],
    valueProps: [
      { icon: Target, label: "Plan", desc: "with Confidence" },
      { icon: TrendingUp, label: "Track", desc: "in Real Time" },
      { icon: Activity, label: "Analyze", desc: "with Clarity" },
      { icon: CheckCircle2, label: "Act", desc: "with Impact" },
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
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function HeroVisual({ slide }: { slide: typeof slides[number] }) {
  if (slide.visual === "dashboard") {
    return (
      <div className="relative w-full max-w-[600px]">
        {/* Main Dashboard Card - Laptop Mockup */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* Laptop frame */}
          <div className="relative rounded-t-2xl border border-white/10 bg-gradient-to-b from-gray-900 to-gray-800 p-1 shadow-2xl">
            {/* Screen bezel */}
            <div className="rounded-t-xl border-2 border-gray-700 bg-[#0a1628] p-4">
              {/* Top bar with TW logo */}
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] to-[#a88520]">
                    <span className="font-heading text-xs font-bold text-[#0B2545]">TW</span>
                  </div>
                  <span className="text-xs font-semibold text-white/90">TrueWorks</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/40">Year: 2026</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>
              </div>

              {/* Executive Overview KPIs */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Executive Overview</p>
              </div>
              
              <div className="mb-4 grid grid-cols-4 gap-2">
                {slide.kpis.map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative overflow-hidden rounded-lg border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-2.5"
                  >
                    <p className="text-[9px] font-medium text-white/50">{kpi.label}</p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-heading text-xs font-bold text-white">{kpi.value}</span>
                      <span className={cn(
                        "text-[8px] font-semibold",
                        kpi.trend === "up" ? "text-emerald-400" : "text-white/40"
                      )}>
                        {kpi.delta}
                      </span>
                    </div>
                    {/* Accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C9A227] to-transparent opacity-60" />
                  </motion.div>
                ))}
              </div>

              {/* Revenue Trend Chart */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">Revenue Trend</p>
                  <p className="text-[9px] font-semibold text-emerald-400">↑ Revenue    ↑ Net Profit</p>
                </div>
                <div className="flex h-16 items-end gap-1">
                  {barData.map((height, i) => (
                    <div key={i} className="relative flex-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                        className={cn(
                          "rounded-t-sm",
                          i === barData.length - 1
                            ? "bg-gradient-to-t from-[#C9A227] to-[#e8c050]"
                            : "bg-gradient-to-t from-[#4A6FA5] to-[#5a7fb5]"
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between px-0.5">
                  {monthLabels.map((month, i) => (
                    <span key={month} className="text-[7px] text-white/30">{month}</span>
                  ))}
                </div>
              </div>

              {/* Department Performance */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  <p className="text-[8px] font-medium text-white/50">Department Performance</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="relative h-10 w-10">
                      <svg className="h-10 w-10 -rotate-90 transform">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-white/5"
                        />
                        <motion.circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={100.5}
                          initial={{ strokeDashoffset: 100.5 }}
                          animate={{ strokeDashoffset: 24 }}
                          transition={{ delay: 1, duration: 1.5 }}
                          className="text-[#C9A227]"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">76%</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      {["Operations", "Finance", "Marketing", "HR"].map((dept, i) => (
                        <div key={dept} className="flex items-center justify-between text-[8px]">
                          <span className="text-white/60">{dept}</span>
                          <span className="font-semibold text-white/80">{92 - i * 10}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  <p className="text-[8px] font-medium text-white/50">Top Expenses</p>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { name: "Salaries & Wages", pct: 45 },
                      { name: "Supplies & Operations", pct: 30 },
                      { name: "Utilities", pct: 15 },
                      { name: "Other", pct: 10 },
                    ].map((expense) => (
                      <div key={expense.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[8px]">
                          <span className="text-white/60">{expense.name}</span>
                          <span className="font-semibold text-white/80">{expense.pct}%</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${expense.pct}%` }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-[#4A6FA5] to-[#5a7fb5]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Laptop base */}
            <div className="h-3 rounded-b-2xl bg-gradient-to-b from-gray-700 to-gray-800" />
            <div className="mx-auto h-1 w-32 rounded-b-lg bg-gray-600" />
          </div>
        </motion.div>

        {/* Floating stat cards */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -right-4 top-8 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1628]/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9A227] to-[#a88520]">
            <TrendingUp className="h-4 w-4 text-[#0B2545]" />
          </div>
          <div>
            <p className="text-[9px] font-medium text-white/50">Growth</p>
            <p className="text-xs font-bold text-white">+15.3%</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1628]/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-medium text-white/50">Delivery</p>
            <p className="text-xs font-bold text-white">Instant</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Similar dashboard for other slides
  return (
    <div className="relative w-full max-w-[600px]">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Laptop frame */}
        <div className="relative rounded-t-2xl border border-white/10 bg-gradient-to-b from-gray-900 to-gray-800 p-1 shadow-2xl">
          <div className="rounded-t-xl border-2 border-gray-700 bg-[#0a1628] p-4">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] to-[#a88520]">
                  <span className="font-heading text-xs font-bold text-[#0B2545]">TW</span>
                </div>
                <span className="text-xs font-semibold text-white/90">TrueWorks</span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{slide.label}</p>
            </div>
            
            <div className="mb-4 grid grid-cols-4 gap-2">
              {slide.kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden rounded-lg border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-2.5"
                >
                  <p className="text-[9px] font-medium text-white/50">{kpi.label}</p>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-heading text-xs font-bold text-white">{kpi.value}</span>
                    <span className={cn(
                      "text-[8px] font-semibold",
                      kpi.trend === "up" ? "text-emerald-400" : "text-white/40"
                    )}>
                      {kpi.delta}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C9A227] to-transparent opacity-60" />
                </motion.div>
              ))}
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">Performance Trend</p>
                <p className="text-[9px] font-semibold text-emerald-400">↑ Revenue</p>
              </div>
              <div className="flex h-16 items-end gap-1">
                {barData.map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                    className={cn(
                      "flex-1 rounded-t-sm",
                      i === barData.length - 1
                        ? "bg-gradient-to-t from-[#C9A227] to-[#e8c050]"
                        : slide.accent === "emerald" ? "bg-gradient-to-t from-emerald-600 to-emerald-500"
                        : slide.accent === "rose" ? "bg-gradient-to-t from-rose-600 to-rose-500"
                        : slide.accent === "violet" ? "bg-gradient-to-t from-violet-600 to-violet-500"
                        : "bg-gradient-to-t from-blue-600 to-blue-500"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="h-3 rounded-b-2xl bg-gradient-to-b from-gray-700 to-gray-800" />
          <div className="mx-auto h-1 w-32 rounded-b-lg bg-gray-600" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -right-4 top-8 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1628]/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9A227] to-[#a88520]">
          <Activity className="h-4 w-4 text-[#0B2545]" />
        </div>
        <div>
          <p className="text-[9px] font-medium text-white/50">Real-time</p>
          <p className="text-xs font-bold text-white">Updates</p>
        </div>
      </motion.div>
    </div>
  );
}

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
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="gradient-brand relative min-h-[90vh] overflow-hidden">
      <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />

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

      <div className="absolute -top-32 right-[-8%] h-[580px] w-[580px] rounded-full bg-accent/[0.08] blur-3xl" aria-hidden />
      <div className="absolute bottom-[-20%] left-[-6%] h-[520px] w-[520px] rounded-full bg-secondary/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
            transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="grid items-center gap-16 lg:grid-cols-2 lg:gap-14"
          >
            {/* Copy */}
            <div className="text-center lg:text-left">
              <motion.p
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent"
              >
                <Users className="h-3.5 w-3.5" />
                {slide.tagline}
              </motion.p>

              <motion.h1
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="mt-6 font-heading text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
              >
                {slide.title}
              </motion.h1>

              <motion.p
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/75 lg:mx-0 lg:text-xl"
              >
                {slide.description}
              </motion.p>

              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
              >
                <Link href="/store" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-14 w-full gradient-gold px-8 text-base font-bold text-primary-dark shadow-2xl shadow-accent/30 transition-all hover:scale-105 hover:shadow-accent/40 sm:w-auto"
                  >
                    EXPLORE SOLUTIONS
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/#demo" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 w-full border-2 border-white/30 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    WATCH VIDEO
                  </Button>
                </Link>
              </motion.div>

              {/* Value Props Grid */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="mt-14 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4"
              >
                {slide.valueProps.map((prop, i) => (
                  <motion.div
                    key={prop.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex flex-col items-center text-center lg:items-start lg:text-left"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm">
                      <prop.icon className="h-6 w-6 text-accent" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">{prop.label}</p>
                    <p className="mt-0.5 text-xs text-white/60">{prop.desc}</p>
                  </motion.div>
                ))}
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
              <HeroVisual slide={slide} />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slide navigation dots */}
        <div className="mt-14 flex items-center justify-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === current ? "w-10 bg-accent" : "w-2 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Industry Icons Strip - Inspired by reference */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 border-t border-white/10 pt-12"
        >
          <div className="mb-8 flex items-center justify-center gap-3 text-white/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm font-semibold">
              Trusted by forward-thinking organizations to drive clarity, efficiency and growth.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 sm:grid-cols-6">
            {[
              { icon: Stethoscope, label: "HEALTHCARE" },
              { icon: GraduationCap, label: "EDUCATION" },
              { icon: HeartHandshake, label: "NGOs" },
              { icon: Building2, label: "MANUFACTURING" },
              { icon: Activity, label: "FINANCIAL SERVICES" },
              { icon: Users, label: "AND MORE" },
            ].map((industry) => (
              <motion.div
                key={industry.label}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-2.5 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-colors hover:border-accent/50 hover:bg-white/[0.06]">
                  <industry.icon className="h-6 w-6 text-white/70" />
                </div>
                <p className="text-[10px] font-semibold tracking-wider text-white/50">{industry.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats - More prominent like references */}
        <motion.dl
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-20 grid grid-cols-2 gap-10 border-t border-white/10 pt-12 sm:grid-cols-4"
        >
          {[
            { value: "300+", label: "Organizations" },
            { value: "50+", label: "Smart Solutions" },
            { value: "10K+", label: "Users" },
            { value: "1 Goal", label: "Your Success" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-4xl font-bold text-white lg:text-5xl">{stat.value}</dd>
              <dd className="mt-2 text-sm font-medium text-white/60">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}