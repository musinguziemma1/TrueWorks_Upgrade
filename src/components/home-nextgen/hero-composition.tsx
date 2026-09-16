"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";
import { AreaTrend, BarSeries } from "./charts";
import { FLOATING_DASHBOARDS, HERO_KPIS } from "./data";
import { EASE_OUT } from "./motion";

/* -------------------------------------------------------------------------- *
 * Hero composition
 *
 * A layered product surface: a dominant executive dashboard with secondary
 * dashboards floating behind it. KPI counters animate upward, charts draw
 * themselves, and the stack tilts very slightly toward the pointer on desktop
 * (disabled for touch and reduced-motion users).
 * -------------------------------------------------------------------------- */

function useDesktopPointer() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  return trend === "down" ? (
    <TrendingDown className="h-3 w-3 text-emerald-400" />
  ) : (
    <TrendingUp className="h-3 w-3 text-accent-light" />
  );
}
export default function HeroComposition() {
  const reduceMotion = useReducedMotion();
  const isDesktop = useDesktopPointer();
  const tiltEnabled = isDesktop && !reduceMotion;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useSpring(x, { stiffness: 80, damping: 20, mass: 0.6 });
  const rotateX = useSpring(y, { stiffness: 80, damping: 20, mass: 0.6 });

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(relX * 4);
    y.set(relY * -3);
  };

  const resetPointer = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      className="relative"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
      aria-hidden
    >
      <div className="absolute -inset-x-10 -top-10 bottom-0 rounded-[3rem] bg-gradient-to-br from-accent/[0.12] via-transparent to-sky-500/[0.12] blur-3xl" />

      <motion.div
        className="relative mx-auto w-full max-w-[620px] lg:max-w-none"
        style={tiltEnabled ? { rotateX, rotateY, transformPerspective: 1400 } : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Primary dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 26 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.95, delay: 0.45, ease: EASE_OUT }}
          className="relative z-20 overflow-hidden rounded-2xl border border-white/12 bg-[#08172C]/95 shadow-[0_50px_120px_-50px_rgba(2,10,22,0.95)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent-light to-accent-dark text-[10px] font-bold text-[#071A33]">
                TW
              </span>
              <div>
                <p className="text-[12px] font-semibold text-white">Executive Command Centre</p>
                <p className="text-[10px] text-white/45">Consolidated · 24 KPIs · monthly close</p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300 sm:inline-flex">
              Reconciled
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {HERO_KPIS.map((kpi, index) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.75 + index * 0.12, ease: EASE_OUT }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
                  {kpi.label}
                </p>
                <p className="mt-1.5 font-heading text-lg font-semibold tracking-tight text-white">
                  <CountUp
                    end={kpi.value}
                    prefix={kpi.prefix}
                    suffix={kpi.suffix}
                    decimals={Number.isInteger(kpi.value) ? 0 : 1}
                    duration={1600}
                  />
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/45">
                  <TrendIcon trend={kpi.trend} />
                  {kpi.delta}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-[1.55fr_1fr]">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-white/55">Revenue &amp; margin trend</p>
                <span className="text-[11px] font-semibold text-accent-light">+4.2% vs budget</span>
              </div>
              <AreaTrend
                points={[28, 34, 31, 44, 40, 52, 49, 63, 61, 74, 71, 84]}
                className="mt-4 h-[104px]"
                height={104}
                width={360}
                strokeClassName="stroke-accent-light"
                fillColor="rgba(218,165,32,0.26)"
                delay={0.9}
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-medium text-white/55">Cash position</p>
              <BarSeries
                values={[46, 62, 54, 78]}
                labels={["W1", "W2", "W3", "W4"]}
                className="mt-4 h-[104px]"
                barClassName="bg-gradient-to-t from-accent/50 to-accent-light"
                delay={1.05}
              />
            </div>
          </div>
        </motion.div>

        {/* Secondary dashboards floating behind the primary surface */}
        {FLOATING_DASHBOARDS.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: card.delay, ease: EASE_OUT }}
            className={cn(
              "absolute z-30 hidden w-[190px] rounded-xl border border-white/12 bg-[#08172C]/90 p-3.5 shadow-[0_30px_70px_-40px_rgba(2,10,22,0.95)] backdrop-blur-md lg:block",
              card.position
            )}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
              transition={{
                duration: 7 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.8,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/12 text-accent-light">
                  <card.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-white">{card.title}</p>
                  <p className="truncate text-[9px] uppercase tracking-[0.14em] text-white/40">
                    {card.subtitle}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                <p className="font-heading text-sm font-semibold text-white">{card.kpi}</p>
                <p className="text-[9px] text-white/45">{card.kpiLabel}</p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-accent-light">
                <span>Open system</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}