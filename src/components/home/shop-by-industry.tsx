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
import NavyBackground from "./navy-background";

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

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Folder;
}

export default function ShopByIndustry() {
  if (!convexClient) return null;
  return <ShopByIndustryInner />;
}

function ShopByIndustryInner() {
  const categories = useQuery(api.categories.list, {});

  if (categories === undefined) {
    return (
      <section className="relative overflow-hidden py-20 lg:py-24">
        <NavyBackground />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#DAA520]">Industries</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">Built for Your Sector</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="h-12 w-12 rounded-xl bg-white/10" />
                <div className="mt-4 h-4 w-24 rounded bg-white/10" />
                <div className="mt-2 h-3 w-20 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const items = categories;

  return (
    <section className="relative overflow-hidden py-20 lg:py-24">
      <NavyBackground />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#DAA520]">
            Industries
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
            Built for Your Sector
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/85">
            Every template is designed around the real workflows of your industry -
            not generic spreadsheets.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {items.map((cat, i) => {
            const Icon = getIcon(cat.icon ?? "");
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
                  className="group flex h-full flex-col items-start gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#DAA520]/50 hover:bg-white/10 hover:shadow-elevated"
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DAA520] text-[#071A33] transition-colors duration-300 group-hover:bg-[#DAA520]/90">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#DAA520]" />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold text-white">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="mt-1 text-xs leading-relaxed text-white/50 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] font-medium text-[#DAA520]">
                      {cat.productCount} {cat.productCount === 1 ? "template" : "templates"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
