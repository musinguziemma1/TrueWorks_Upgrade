"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Hospital,
  BarChart3,
  Heart,
  GraduationCap,
  Kanban,
  Users,
  Briefcase,
  TrendingUp,
  Church,
  Sprout,
  Folder,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";

const iconMap: Record<string, LucideIcon> = {
  Hospital,
  BarChart3,
  Heart,
  HeartHand: Heart,
  GraduationCap,
  Kanban,
  Users,
  Briefcase,
  TrendingUp,
  Church,
  Sprout,
};

const accentByCategory: Record<string, { tint: string; iconText: string; chip: string }> = {
  Hospital: { tint: "from-blue-500/12 to-blue-500/0", iconText: "text-blue-600 dark:text-blue-400", chip: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  Healthcare: { tint: "from-blue-500/12 to-blue-500/0", iconText: "text-blue-600 dark:text-blue-400", chip: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  Education: { tint: "from-amber-500/12 to-amber-500/0", iconText: "text-amber-600 dark:text-amber-400", chip: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  "Schools & Colleges": { tint: "from-amber-500/12 to-amber-500/0", iconText: "text-amber-600 dark:text-amber-400", chip: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  Church: { tint: "from-purple-500/12 to-purple-500/0", iconText: "text-purple-600 dark:text-purple-400", chip: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  "Churches & Ministries": { tint: "from-purple-500/12 to-purple-500/0", iconText: "text-purple-600 dark:text-purple-400", chip: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  NGO: { tint: "from-rose-500/12 to-rose-500/0", iconText: "text-rose-600 dark:text-rose-400", chip: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  "NGOs & Non-profits": { tint: "from-rose-500/12 to-rose-500/0", iconText: "text-rose-600 dark:text-rose-400", chip: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  Finance: { tint: "from-emerald-500/12 to-emerald-500/0", iconText: "text-emerald-600 dark:text-emerald-400", chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  "Finance Teams": { tint: "from-emerald-500/12 to-emerald-500/0", iconText: "text-emerald-600 dark:text-emerald-400", chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  Business: { tint: "from-cyan-500/12 to-cyan-500/0", iconText: "text-cyan-600 dark:text-cyan-400", chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
  "SMEs & Startups": { tint: "from-cyan-500/12 to-cyan-500/0", iconText: "text-cyan-600 dark:text-cyan-400", chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
  Agriculture: { tint: "from-lime-500/12 to-lime-500/0", iconText: "text-lime-700 dark:text-lime-400", chip: "border-lime-500/30 bg-lime-500/10 text-lime-700 dark:text-lime-300" },
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Folder;
}

function getAccent(name: string) {
  return accentByCategory[name] ?? {
    tint: "from-primary/10 to-primary/0",
    iconText: "text-primary",
    chip: "border-primary/30 bg-primary/10 text-primary",
  };
}

export default function ShopByIndustry() {
  if (!convexClient) return null;
  return <ShopByIndustryInner />;
}

function ShopByIndustryInner() {
  const categories = useQuery(api.categories.list, {});

  if (categories === undefined) {
    return (
      <section className="relative bg-surface py-20 lg:py-24">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">Industries</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">Built for Your Sector</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/70 bg-white p-6">
                <div className="h-12 w-12 rounded-xl bg-muted" />
                <div className="mt-4 h-4 w-24 rounded bg-muted" />
                <div className="mt-2 h-3 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const items = categories;

  return (
    <section className="relative bg-surface py-20 lg:py-24">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Industries
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Built for your sector
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Every template is designed around the real workflows of your
            industry - not generic spreadsheets.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {items.map((cat, i) => {
            const Icon = getIcon(cat.icon ?? "");
            const accent = getAccent(cat.name);
            return (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  href={`/store?category=${encodeURIComponent(cat.name)}`}
                  className="group relative flex h-full flex-col items-start gap-4 overflow-hidden rounded-xl border border-border/70 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${accent.tint}`}
                    aria-hidden
                  />
                  <div className="relative flex w-full items-start justify-between">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ring-1 ring-border ${accent.iconText} transition-all group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <div className="relative">
                    <p className="font-heading text-base font-semibold text-primary">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {cat.description}
                      </p>
                    )}
                    <span
                      className={`mt-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${accent.chip}`}
                    >
                      {cat.productCount} {cat.productCount === 1 ? "template" : "templates"}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/store"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent-dark"
          >
            Browse all templates
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
