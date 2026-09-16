"use client";

import { useId, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- *
 * Lightweight, self-drawing SVG charts.
 *
 * Hand-rolled on purpose: each one is a few hundred bytes, needs no chart
 * runtime on the homepage, and animates cheaply (pathLength / transform).
 * -------------------------------------------------------------------------- */

function buildPath(points: number[], width: number, height: number): string {
  if (points.length === 0) return "";
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const stepX = width / Math.max(points.length - 1, 1);

  return points
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export interface AreaTrendProps {
  points: number[];
  className?: string;
  strokeClassName?: string;
  fillColor?: string;
  height?: number;
  width?: number;
  duration?: number;
  delay?: number;
}

/** Area + line chart that draws itself when scrolled into view. */
export function AreaTrend({
  points,
  className,
  strokeClassName = "stroke-accent",
  fillColor = "rgba(218,165,32,0.28)",
  height = 120,
  width = 320,
  duration = 1.5,
  delay = 0,
}: AreaTrendProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const gradientId = useId();

  const line = buildPath(points, width, height);
  const area = `${line} L${width},${height} L0,${height} Z`;
  const animate = inView || reduceMotion;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} />
            <stop offset="100%" stopColor="rgba(218,165,32,0)" />
          </linearGradient>
        </defs>

        <motion.path
          d={area}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={animate ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.9, delay: delay + 0.35 }}
        />
        <motion.path
          d={line}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          className={strokeClassName}
          initial={{ pathLength: 0 }}
          animate={animate ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : duration, delay, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

export interface BarSeriesProps {
  values: number[];
  className?: string;
  barClassName?: string;
  labels?: string[];
  delay?: number;
}

/** Column chart whose bars grow in sequence. */
export function BarSeries({
  values,
  className,
  barClassName = "bg-accent/80",
  labels,
  delay = 0,
}: BarSeriesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const max = Math.max(...values, 1);
  const animate = inView || reduceMotion;

  return (
    <div ref={ref} className={cn("flex h-full items-end gap-2", className)} aria-hidden>
      {values.map((value, index) => (
        <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <motion.div
            className={cn("w-full rounded-t-[3px]", barClassName)}
            style={{ height: `${(value / max) * 100}%`, transformOrigin: "bottom" }}
            initial={{ scaleY: 0, opacity: 0.4 }}
            animate={animate ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0.4 }}
            transition={{
              duration: reduceMotion ? 0.01 : 0.7,
              delay: delay + index * 0.09,
              ease: "easeOut",
            }}
          />
          {labels?.[index] ? (
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/45">
              {labels[index]}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Compact inline trend, used in KPI cards and table rows. */
export function Sparkline({
  points,
  className,
  tone = "accent",
}: {
  points: number[];
  className?: string;
  tone?: "accent" | "emerald" | "slate";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const reduceMotion = useReducedMotion();
  const width = 120;
  const height = 36;
  const stroke =
    tone === "emerald" ? "text-emerald-500" : tone === "slate" ? "text-slate-400" : "text-accent";

  return (
    <div ref={ref} className={cn("h-9 w-[120px]", className)} aria-hidden>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <motion.path
          d={buildPath(points, width, height)}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          stroke="currentColor"
          className={stroke}
          initial={{ pathLength: 0 }}
          animate={inView || reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 1.1, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

/** Circular gauge for single-value indicators (occupancy, utilisation). */
export function GaugeRing({
  value,
  label,
  caption,
  className,
  size = 132,
}: {
  value: number;
  label: string;
  caption?: string;
  className?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div ref={ref} className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={8}
            className="stroke-white/10"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={8}
            strokeLinecap="round"
            className="stroke-accent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={
              inView || reduceMotion
                ? { strokeDashoffset: offset }
                : { strokeDashoffset: circumference }
            }
            transition={{ duration: reduceMotion ? 0.01 : 1.4, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold text-white">{clamped}%</span>
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-white/50">
            {label}
          </span>
        </div>
      </div>
      {caption ? <p className="mt-3 text-xs text-white/55">{caption}</p> : null}
    </div>
  );
}