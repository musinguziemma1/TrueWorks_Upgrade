"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AreaTrend, BarSeries, GaugeRing } from "./charts";

/* -------------------------------------------------------------------------- *
 * MediaFrame
 *
 * Renders a production image inside a device-style frame, and degrades to a
 * designed dashboard placeholder when the asset has not been added yet. Drop
 * the final WebP at the documented path in data.ts and the real artwork
 * appears with no markup changes.
 * -------------------------------------------------------------------------- */

export interface MediaFrameProps {
  src: string;
  alt: string;
  fallback: ReactNode;
  /** Tailwind aspect utility for the media area. */
  ratio?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  zoomOnHover?: boolean;
  /** Short caption shown in the frame chrome. */
  label?: string;
  /** Render browser-style chrome above the media. */
  chrome?: boolean;
}

export function MediaFrame({
  src,
  alt,
  fallback,
  ratio = "aspect-[16/10]",
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  zoomOnHover = true,
  label,
  chrome = true,
}: MediaFrameProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "group/frame relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1830] shadow-[0_30px_80px_-40px_rgba(4,16,31,0.85)]",
        className
      )}
    >
      {chrome ? (
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-accent/60" />
          </div>
          <span className="truncate rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
            {label ?? "trueworks · systems"}
          </span>
        </div>
      ) : null}

      <div className={cn("relative overflow-hidden", ratio)}>
        {failed ? (
          <div className="absolute inset-0">{fallback}</div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            onError={() => setFailed(true)}
            className={cn(
              "object-cover",
              zoomOnHover &&
                "transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover/frame:scale-[1.04]"
            )}
          />
        )}
      </div>
    </div>
  );
}
/* -------------------------------------------------------------------------- *
 * Dashboard placeholder
 *
 * A designed stand-in that reads as a premium product surface: header, KPI
 * row, chart region and supporting detail. Used for hero, product, industry
 * and free-resource media areas until real artwork is dropped in.
 * -------------------------------------------------------------------------- */

export type PlaceholderVariant =
  | "executive"
  | "finance"
  | "sales"
  | "hr"
  | "healthcare"
  | "operations"
  | "overview";

const VARIANT_CONFIG: Record<
  PlaceholderVariant,
  { title: string; subtitle: string; metrics: { label: string; value: string }[]; labels: string[] }
> = {
  executive: {
    title: "Executive overview",
    subtitle: "Consolidated performance",
    metrics: [
      { label: "Revenue", value: "1.84M" },
      { label: "Margin", value: "18.4%" },
      { label: "Variance", value: "-2.1%" },
      { label: "Cover", value: "13 wks" },
    ],
    labels: ["Q1", "Q2", "Q3", "Q4"],
  },
  finance: {
    title: "Treasury position",
    subtitle: "Cash flow and budget",
    metrics: [
      { label: "Cash", value: "1.24M" },
      { label: "DSO", value: "46d" },
      { label: "Margin", value: "41.7%" },
      { label: "Burn", value: "0.42M" },
    ],
    labels: ["Jan", "Feb", "Mar", "Apr"],
  },
  sales: {
    title: "Revenue pipeline",
    subtitle: "Stage weighted forecast",
    metrics: [
      { label: "Pipeline", value: "412K" },
      { label: "Win rate", value: "38%" },
      { label: "Cycle", value: "21d" },
      { label: "Renewals", value: "17" },
    ],
    labels: ["New", "Qual", "Prop", "Won"],
  },
  hr: {
    title: "Workforce plan",
    subtitle: "Establishment vs actual",
    metrics: [
      { label: "Headcount", value: "146" },
      { label: "Vacancies", value: "4" },
      { label: "Attrition", value: "6.9%" },
      { label: "Training", value: "82%" },
    ],
    labels: ["Ops", "Clin", "Fin", "Sup"],
  },
  healthcare: {
    title: "Hospital performance",
    subtitle: "Clinical and financial",
    metrics: [
      { label: "Occupancy", value: "78%" },
      { label: "Patients", value: "142" },
      { label: "Rev/bed", value: "2.4K" },
      { label: "Avg bill", value: "85" },
    ],
    labels: ["W1", "W2", "W3", "W4"],
  },
  operations: {
    title: "Operational control",
    subtitle: "Throughput and cost",
    metrics: [
      { label: "Throughput", value: "1,240" },
      { label: "Cost/unit", value: "18.2" },
      { label: "Yield", value: "94%" },
      { label: "Downtime", value: "2.1h" },
    ],
    labels: ["Mon", "Tue", "Wed", "Thu"],
  },
  overview: {
    title: "Management summary",
    subtitle: "Data to decision",
    metrics: [
      { label: "Data rows", value: "12,480" },
      { label: "Checks", value: "36" },
      { label: "KPIs", value: "24" },
      { label: "Insights", value: "9" },
    ],
    labels: ["Load", "Map", "Calc", "Report"],
  },
};
export function DashboardPlaceholder({
  variant = "executive",
  className,
}: {
  variant?: PlaceholderVariant;
  className?: string;
}) {
  const config = VARIANT_CONFIG[variant];
  const trend = [32, 41, 38, 52, 48, 61, 58, 72, 69, 81];

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#123663]",
        className
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-sm font-semibold text-white">{config.title}</p>
            <p className="mt-0.5 text-[11px] text-white/50">{config.subtitle}</p>
          </div>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-light">
            Demo data
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {config.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
                {metric.label}
              </p>
              <p className="mt-1 font-heading text-base font-semibold text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[1.6fr_1fr]">
          <div className="flex min-h-[110px] flex-col rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-white/55">Trend</p>
              <p className="text-[11px] font-semibold text-accent-light">+4.2%</p>
            </div>
            <AreaTrend
              points={trend}
              className="mt-3 flex-1"
              height={90}
              width={320}
              strokeClassName="stroke-accent-light"
              fillColor="rgba(218,165,32,0.25)"
            />
          </div>
          <div className="flex min-h-[110px] flex-col rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] font-medium text-white/55">Composition</p>
            <BarSeries
              values={[54, 72, 46, 88]}
              labels={config.labels}
              className="mt-3 flex-1"
              barClassName="bg-accent/70"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
/** Gauge-led placeholder used inside healthcare and free-resource media. */
export function GaugePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#123663] p-6",
        className
      )}
      aria-hidden
    >
      <GaugeRing value={78} label="Occupancy" size={148} />
      <div className="grid w-full max-w-xs grid-cols-2 gap-2.5">
        {[
          { label: "Revenue / bed", value: "$2,400" },
          { label: "Patients / day", value: "142" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{item.label}</p>
            <p className="mt-1 font-heading text-sm font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}