"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, FileSpreadsheet, Wallet, Users, Clock } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

const kpis = [
  { label: "Revenue Growth", value: 24.7, decimals: 1, suffix: "%", trend: "up", color: "#10B981" },
  { label: "Active Templates", value: 500, suffix: "+", color: "#DAA520" },
  { label: "Avg. Time Saved", value: 18, suffix: "hrs", color: "#3B82F6" },
];

const barData = [42, 58, 35, 70, 52, 84, 63, 95, 77, 88, 66, 99];

export default function StoreHeroVisual() {
  return (
    <div className="relative hidden lg:block" aria-hidden>
      {/* Glow */}
      <div className="absolute -inset-6 rounded-3xl bg-accent/[0.12] blur-3xl" />

      {/* Main dashboard window */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
        className="relative rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 backdrop-blur-xl shadow-2xl"
        style={{ transformPerspective: 1200 }}
      >
        {/* Window bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DAA520]">
              <FileSpreadsheet className="h-4 w-4 text-[#04101F]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Finance Dashboard</p>
              <p className="text-[10px] text-white/50">TrueWorks BOS</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          </div>
        </div>

        {/* KPI row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.15 }}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
            >
              <p className="text-[10px] text-white/55">
                {kpi.label}{" "}
                {kpi.trend === "up" ? (
                  <TrendingUp className="ml-0.5 inline h-3 w-3 text-emerald-400" />
                ) : kpi.trend === "down" ? (
                  <TrendingDown className="ml-0.5 inline h-3 w-3 text-red-400" />
                ) : null}
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-white leading-none">
                <CountUp end={kpi.value} suffix={kpi.suffix} decimals={kpi.decimals ?? 0} />
              </p>
              <div className="mt-2 h-1 rounded-full opacity-60" style={{ backgroundColor: kpi.color }} />
            </motion.div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-white/70">
              <BarChart3 className="h-3.5 w-3.5 text-accent" />
              Monthly Performance
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +24.7%
            </span>
          </div>
          <div className="flex h-20 items-end gap-1.5">
            {barData.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-[#DAA520] to-[#B8860B]"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: 0.9 + i * 0.06, ease: "easeOut" }}
              />
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <Wallet className="h-4 w-4 text-accent" />
            </span>
            <div>
              <p className="text-[10px] text-white/55">Avg. Order Value</p>
              <p className="text-sm font-semibold text-white leading-none">$34.90</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <Clock className="h-4 w-4 text-accent" />
            </span>
            <div>
              <p className="text-[10px] text-white/55">Download Time</p>
              <p className="text-sm font-semibold text-white leading-none">&lt; 1 min</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badge - top right */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: [0, -8, 0] }}
        transition={{ opacity: { delay: 1.2 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -right-4 -top-5 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 backdrop-blur-xl shadow-xl"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
          <Users className="h-4 w-4 text-emerald-400" />
        </span>
        <div>
          <p className="text-[10px] text-white/60">Active Users</p>
          <p className="font-heading text-sm font-bold text-white">2,400+</p>
        </div>
      </motion.div>

      {/* Floating badge - bottom left */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.4 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}
        className="absolute -left-6 -bottom-5 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 backdrop-blur-xl shadow-xl"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
          <FileSpreadsheet className="h-4 w-4 text-accent" />
        </span>
        <div>
          <p className="text-[10px] text-white/60">Ready-to-use</p>
          <p className="font-heading text-sm font-bold text-white">Excel Templates</p>
        </div>
      </motion.div>
    </div>
  );
}