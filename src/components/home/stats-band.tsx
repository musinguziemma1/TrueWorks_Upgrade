"use client";

import { Download, Building2, Users, FileSpreadsheet } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

const stats = [
  { icon: Download, end: 2400, suffix: "+", label: "Templates Downloaded" },
  { icon: Building2, end: 500, suffix: "+", label: "Organizations Served" },
  { icon: Users, end: 8, suffix: "+", label: "Global Sectors Covered" },
  { icon: FileSpreadsheet, end: 40, suffix: "+", label: "Ready-to-Use Spreadsheets" },
];

export default function StatsBand() {
  return (
    <section className="gradient-brand relative overflow-hidden py-14 lg:py-16">
      <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071A33] via-transparent to-[#071A33]" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/10 px-6 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-center gap-4 px-6 py-6 lg:py-2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
              <stat.icon className="h-5 w-5 text-accent" />
            </span>
            <div>
              <span className="block font-heading text-3xl font-bold tracking-tight text-white lg:text-4xl">
                <CountUp end={stat.end} suffix={stat.suffix} />
              </span>
              <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-white/85">
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}