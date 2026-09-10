"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
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
  BriefcaseBusiness,
  UsersRound,
  ShoppingCart,
  Package,
  ShieldCheck,
  Settings2,
  Landmark,
  HeartHandshake,
  Building2,
  WalletCards,
  Store,
  Folder,
  Pause,
  Play,
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
  BriefcaseBusiness,
  UsersRound,
  ShoppingCart,
  Package,
  ShieldCheck,
  Settings2,
  Landmark,
  HeartHandshake,
  Building2,
  WalletCards,
  Store,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Folder;
}

const CARDS_PER_VIEW = 4;
const AUTO_PLAY_INTERVAL = 4000;

export default function ShopByIndustry() {
  if (!convexClient) return null;
  return <ShopByIndustryInner />;
}

function ShopByIndustryInner() {
  const categories = useQuery(api.categories.list, {});
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items = categories ?? [];
  const total = items.length;
  const maxIndex = Math.max(0, total - CARDS_PER_VIEW);

  const next = useCallback(() => {
    setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto-play
  useEffect(() => {
    if (isPaused || isHovered || total <= CARDS_PER_VIEW) return;
    intervalRef.current = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, isHovered, next, total]);

  if (categories === undefined) {
    return (
      <section className="relative overflow-hidden py-20 lg:py-24">
        <NavyBackground />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#DAA520]">
              Industries
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
              Built for Your Sector
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
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

  return (
    <section className="relative overflow-hidden py-20 lg:py-24">
      <NavyBackground />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
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
            Every template is designed around the real workflows of your
            industry - not generic spreadsheets.
          </p>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Cards Container */}
          <div className="overflow-hidden rounded-2xl">
            <motion.div
              className="flex gap-4"
              animate={{
                x: `-${current * (100 / CARDS_PER_VIEW + (4 * 4) / (CARDS_PER_VIEW * 16))}%`,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 0.8,
              }}
            >
              {items.map((cat, i) => {
                const Icon = getIcon(cat.icon ?? "");
                return (
                  <div
                    key={cat._id}
                    className="w-[calc(25%-12px)] shrink-0"
                  >
                    <Link
                      href={`/store?category=${encodeURIComponent(cat.name)}`}
                      className="group flex h-full flex-col items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#DAA520]/50 hover:bg-white/10 hover:shadow-elevated"
                    >
                      <div className="flex w-full items-start justify-between">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DAA520] text-[#071A33] transition-colors duration-300 group-hover:bg-[#DAA520]/90">
                          <Icon className="h-5 w-5" />
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#DAA520]" />
                      </div>
                      <div>
                        {cat.code && (
                          <p className="mb-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#DAA520]/80">
                            {cat.code}
                          </p>
                        )}
                        <p className="font-heading text-base font-semibold text-white">
                          {cat.name}
                        </p>
                        {cat.description && (
                          <p className="mt-1 text-xs leading-relaxed text-white/50 line-clamp-2">
                            {cat.description}
                          </p>
                        )}
                        <p className="mt-1.5 text-[11px] font-medium text-[#DAA520]">
                          {cat.productCount}{" "}
                          {cat.productCount === 1 ? "template" : "templates"}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Navigation Arrows */}
          {total > CARDS_PER_VIEW && (
            <>
              <button
                onClick={prev}
                className="absolute -left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-[#DAA520]/50 hover:bg-[#DAA520]/20"
                aria-label="Previous industries"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute -right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-[#DAA520]/50 hover:bg-[#DAA520]/20"
                aria-label="Next industries"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Controls */}
          {total > CARDS_PER_VIEW && (
            <div className="mt-6 flex items-center justify-center gap-4">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-6 bg-[#DAA520]"
                        : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Play/Pause */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/60 backdrop-blur-sm transition-all hover:border-[#DAA520]/50 hover:text-[#DAA520]"
                aria-label={isPaused ? "Resume auto-play" : "Pause auto-play"}
              >
                {isPaused ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
