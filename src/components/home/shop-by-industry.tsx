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

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Folder;
}

const bgParticles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 4,
  duration: Math.random() * 12 + 18,
}));

const bgBeams = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  rotation: Math.random() * 360,
  delay: Math.random() * 3,
}));

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-surface via-white to-surface" />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/[0.04] rounded-full blur-3xl" />

      {bgBeams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: beam.delay,
            ease: "easeInOut",
          }}
          style={{ rotate: beam.rotation }}
        >
          <div className="w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent mx-auto" />
        </motion.div>
      ))}

      {bgParticles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-accent/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-12, 12, -12],
            x: [-6, 6, -6],
            opacity: [0.2, 0.5, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: p.delay,
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "400px 400px",
        }}
      />
    </div>
  );
}

export default function ShopByIndustry() {
  if (!convexClient) return null;
  return <ShopByIndustryInner />;
}

function ShopByIndustryInner() {
  const categories = useQuery(api.categories.list, {});

  if (categories === undefined) {
    return (
      <section className="relative bg-white py-20 lg:py-24">
        <AnimatedBackground />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">Industries</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">Built for Your Sector</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/70 bg-white/60 backdrop-blur-sm p-6">
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
    <section className="relative bg-white py-20 lg:py-24">
      <AnimatedBackground />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Industries
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Built for Your Sector
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted">
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
                  className="group flex h-full flex-col items-start gap-4 rounded-xl border border-border/70 bg-white/70 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-white hover:shadow-elevated"
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-colors duration-300 group-hover:bg-accent group-hover:text-primary-dark">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-border transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent-dark" />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold text-primary">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] font-medium text-accent-dark">
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
