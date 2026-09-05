"use client";

import { Download, Building2, Users, Sparkles } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import NavyBackground from "./navy-background";

const stats = [
  { icon: Building2, end: 1200, suffix: "+", label: "Organizations served" },
  { icon: Download, end: 8400, suffix: "+", label: "Templates downloaded" },
  { icon: Users, end: 30, suffix: "+", label: "Countries reached" },
  { icon: Sparkles, end: 99, suffix: "%", label: "Customer satisfaction" },
];

const accentByIcon: Record<string, { tint: string; iconText: string; ring: string }> = {
  Building2: { tint: "from-blue-500/15 to-blue-500/0", iconText: "text-blue-300", ring: "ring-blue-400/30" },
  Download: { tint: "from-emerald-500/15 to-emerald-500/0", iconText: "text-emerald-300", ring: "ring-emerald-400/30" },
  Users: { tint: "from-purple-500/15 to-purple-500/0", iconText: "text-purple-300", ring: "ring-purple-400/30" },
  Sparkles: { tint: "from-amber-500/20 to-amber-500/0", iconText: "text-accent-light", ring: "ring-accent/30" },
};

export default function StatsBand() {
  return (
    <section className="relative overflow-hidden py-14 lg:py-16">
      <NavyBackground intensity="subtle" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/10 px-6 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:px-8">
        {stats.map((stat) => {
          const accent =
            accentByIcon[stat.icon.displayName ?? stat.icon.name] ?? {
              tint: "from-accent/15 to-accent/0",
              iconText: "text-accent-light",
              ring: "ring-accent/30",
            };
          return (
            <div
              key={stat.label}
              className="group flex items-center justify-center gap-4 px-6 py-6 lg:py-2"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent.tint} ring-1 ${accent.ring} transition-transform duration-300 group-hover:scale-110`}
              >
                <stat.icon className={`h-5 w-5 ${accent.iconText}`} />
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
