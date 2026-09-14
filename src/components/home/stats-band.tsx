"use client";

import { Download, Building2, Users, Sparkles } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import NavyBackground from "./navy-background";

const stats = [
  { icon: Building2, end: 1200, suffix: "+", label: "Organizations served", tint: "from-blue-500/15 to-blue-500/0", iconText: "text-blue-300", ring: "ring-blue-400/30" },
  { icon: Download, end: 8400, suffix: "+", label: "Templates downloaded", tint: "from-emerald-500/15 to-emerald-500/0", iconText: "text-emerald-300", ring: "ring-emerald-400/30" },
  { icon: Users, end: 30, suffix: "+", label: "Countries reached", tint: "from-purple-500/15 to-purple-500/0", iconText: "text-purple-300", ring: "ring-purple-400/30" },
  { icon: Sparkles, end: 99, suffix: "%", label: "Customer satisfaction", tint: "from-amber-500/20 to-amber-500/0", iconText: "text-accent-light", ring: "ring-accent/30" },
];

export default function StatsBand() {
  return (
    <section className="relative overflow-hidden py-14 lg:py-16">
      <NavyBackground intensity="subtle" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/10 px-6 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:px-8">
        {stats.map((stat) => {
          return (
            <div
              key={stat.label}
              className="group flex items-center justify-center gap-4 px-6 py-6 lg:py-2"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tint} ring-1 ${stat.ring} transition-transform duration-300 group-hover:scale-110`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconText}`} />
              </span>
              <div>
                <span className="block font-heading text-3xl font-bold tracking-tight text-white lg:text-4xl">
                  <CountUp end={stat.end} suffix={stat.suffix} />
                </span>
                <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-white/70">
                  {stat.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
