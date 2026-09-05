"use client";

import { useEffect, useState } from "react";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Banknote,
  HeartPulse,
  Building2,
  GraduationCap,
  Wallet,
  Stethoscope,
  ShoppingCart,
  Loader2,
  type LucideIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import NavyBackground from "./navy-background";

type SectorKpi = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type SectorPreview = {
  title: string;
  subtitle: string;
  pill: string;
  ctaHint: string;
  kpis: SectorKpi[];
  progressLabel: string;
  progressNow: string;
  progressTarget: string;
  progressPercent: number;
};

const sectors: SectorPreview[] = [
  {
    title: "Hospital KPI Dashboard",
    subtitle:
      "Perfect for healthcare administrators. Monitor bed occupancy, patient wait times, revenue per bed and more - free forever.",
    pill: "Healthcare",
    ctaHint: "Built for hospitals & clinics",
    kpis: [
      { icon: Stethoscope, label: "Bed Occupancy", value: "78%" },
      { icon: TrendingUp, label: "Revenue / Bed", value: "$2,400" },
      { icon: Users, label: "Patients / Day", value: "142" },
      { icon: Banknote, label: "Average Bill", value: "$85" },
    ],
    progressLabel: "Bed occupancy",
    progressNow: "78%",
    progressTarget: "Target 85%",
    progressPercent: 78,
  },
  {
    title: "NGO Grant Tracker",
    subtitle:
      "Built for program managers. Track every grant, deliverable and donor report in one place - free forever.",
    pill: "NGO",
    ctaHint: "Built for NGOs & non-profits",
    kpis: [
      { icon: HeartPulse, label: "Active Grants", value: "12" },
      { icon: Banknote, label: "Funds Disbursed", value: "$184K" },
      { icon: Users, label: "Beneficiaries", value: "3,420" },
      { icon: TrendingUp, label: "Spend Rate", value: "64%" },
    ],
    progressLabel: "Grant utilization",
    progressNow: "64%",
    progressTarget: "Target 75%",
    progressPercent: 64,
  },
  {
    title: "School Fee Manager",
    subtitle:
      "Built for school administrators. Track fee collection, arrears and class enrollments - free forever.",
    pill: "Education",
    ctaHint: "Built for schools & colleges",
    kpis: [
      { icon: GraduationCap, label: "Students", value: "847" },
      { icon: Wallet, label: "Collected", value: "$214K" },
      { icon: Banknote, label: "Outstanding", value: "$32K" },
      { icon: TrendingUp, label: "Collection Rate", value: "87%" },
    ],
    progressLabel: "Collection rate",
    progressNow: "87%",
    progressTarget: "Target 95%",
    progressPercent: 87,
  },
  {
    title: "SME Cash-Flow Planner",
    subtitle:
      "Built for founders and finance teams. Forecast 12 months of cash, plan expenses and runway - free forever.",
    pill: "Business",
    ctaHint: "Built for SMEs & startups",
    kpis: [
      { icon: Building2, label: "Monthly Revenue", value: "$48K" },
      { icon: Banknote, label: "Burn Rate", value: "$31K" },
      { icon: TrendingUp, label: "Runway", value: "9 mo" },
      { icon: ShoppingCart, label: "Recurring", value: "62%" },
    ],
    progressLabel: "Revenue vs target",
    progressNow: "62%",
    progressTarget: "Target 100%",
    progressPercent: 62,
  },
];

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

export default function FreeResource() {
  const [sectorIdx, setSectorIdx] = useState(0);
  const sector = sectors[sectorIdx];

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "valid" | "error">("idle");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-rotate which sector's preview is shown so the section
  // surfaces all four use-cases without the user scrolling.
  useEffect(() => {
    const t = setInterval(() => {
      setSectorIdx((i) => (i + 1) % sectors.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!convexClient) {
      setStatus("error");
      setErrorMsg("Service unavailable. Please try again later.");
      return;
    }
    setSending(true);
    try {
      await convexClient.mutation(api.subscribers.create, {
        email,
        source: `free-resource-${sector.pill.toLowerCase()}`,
      });
      setStatus("valid");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="free-template" className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl">
            <NavyBackground intensity="rich" variant="dense" />
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />

          <div className="relative grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
            <FadeIn>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-light backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  Free Resource
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur">
                  {sector.pill}
                </span>
              </div>
              <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-white md:text-4xl">
                Get a free {sector.title}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
                {sector.subtitle}
              </p>

              {/* Sector dots */}
              <div className="mt-5 flex items-center gap-2" role="tablist" aria-label="Choose your sector">
                {sectors.map((s, i) => (
                  <button
                    key={s.pill}
                    type="button"
                    onClick={() => setSectorIdx(i)}
                    aria-selected={i === sectorIdx}
                    role="tab"
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === sectorIdx
                        ? "w-8 bg-accent"
                        : "w-1.5 bg-white/25 hover:bg-white/45"
                    }`}
                    aria-label={`Show ${s.pill} preview`}
                  />
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-8 max-w-md" noValidate>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <label htmlFor="free-template-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="free-template-email"
                      type="email"
                      placeholder="Enter your work email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setStatus("idle");
                      }}
                      className={`h-12 w-full rounded-lg border bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/70 outline-none transition-colors focus:bg-white/[0.12] ${
                        status === "error"
                          ? "border-red-400/70"
                          : "border-white/20 focus:border-accent/60"
                      }`}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={sending}
                    className="h-12 shrink-0 gradient-gold px-6 text-sm font-semibold text-primary-dark shadow-lg shadow-accent/20 hover:brightness-105 disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {sending ? "Sending…" : "Send It to Me"}
                  </Button>
                </div>
                {status === "error" && (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs text-red-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errorMsg || "Please enter a valid email address."}
                  </p>
                )}
                {status === "valid" && (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check your inbox - the {sector.pill.toLowerCase()} dashboard link is on its way.
                  </p>
                )}
                <p className="mt-3 text-xs text-white/70">
                  No spam. Unsubscribe anytime. {sector.ctaHint}.
                </p>
              </form>
            </FadeIn>

            {/* Preview card */}
            <FadeIn delay={0.15} className="w-full">
              <div className="relative">
                <AnimateSector sector={sector} />

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light/85">
                  Live preview
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

import { AnimatePresence } from "framer-motion";

function AnimateSector({ sector }: { sector: SectorPreview }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sector.title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl border border-white/10 bg-white p-6 shadow-elevated"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="font-heading text-sm font-semibold text-primary">
            {sector.title}
          </span>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-dark">
            Free
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sector.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border/50 bg-surface p-4"
            >
              <kpi.icon className="mb-2 h-4 w-4 text-primary" />
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className="mt-0.5 font-heading text-base font-bold text-primary">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{sector.progressLabel}</span>
            <span className="font-semibold text-primary">{sector.progressNow}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full gradient-gold"
              initial={{ width: 0 }}
              animate={{ width: `${sector.progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {sector.progressTarget}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
