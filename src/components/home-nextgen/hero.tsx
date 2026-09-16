"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { DashboardPlaceholder, MediaFrame } from "./media";
import { HERO_MEDIA } from "./data";
import { EASE_OUT, MagneticLink, MaskReveal } from "./motion";
import HeroComposition from "./hero-composition";

/* -------------------------------------------------------------------------- *
 * Hero — "The Business Systems Layer"
 *
 * Background fades in, the grid resolves, the primary dashboard scales from
 * 96% to 100%, secondary dashboards slide into place, KPI counters animate and
 * charts draw themselves. Copy stays server-rendered; only motion is client.
 * -------------------------------------------------------------------------- */

export default function NextGenHero() {
  const reduceMotion = useReducedMotion();
  const fade = (delay: number, y = 18) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.01 : 0.7, delay, ease: EASE_OUT },
  });

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-[#04101F] text-white"
      aria-labelledby="hero-heading"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 1.4, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(1200px 620px at 78% -10%, rgba(62,105,144,0.45), transparent 62%), radial-gradient(900px 520px at 6% 108%, rgba(218,165,32,0.14), transparent 58%), linear-gradient(168deg, #04101F 0%, #071A33 52%, #0B2545 100%)",
        }}
      />

      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: reduceMotion ? 0.01 : 1.6, delay: 0.25 }}
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(circle at 50% 18%, black 8%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 18%, black 8%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="max-w-xl">
          <motion.span
            {...fade(0.15, 12)}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur"
          >
            <Sparkles className="h-3 w-3 text-accent-light" />
            The business systems layer
          </motion.span>

          <motion.h1
            id="hero-heading"
            {...fade(0.25, 22)}
            className="mt-6 font-heading text-[clamp(2.4rem,5.2vw,4.35rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-white"
          >
            The systems behind{" "}
            <span className="bg-gradient-to-r from-accent-light via-[#E8C547] to-accent bg-clip-text text-transparent">
              better-run businesses.
            </span>
          </motion.h1>

          <motion.p
            {...fade(0.38)}
            className="mt-6 text-[1.0625rem] leading-relaxed text-white/65 sm:text-lg"
          >
            Professional dashboards, financial models and operational systems designed to turn
            everyday business complexity into clarity.
          </motion.p>

          <motion.div
            {...fade(0.5, 16)}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <MagneticLink
              href="/store"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent-light to-accent-dark px-6 py-4 text-sm font-semibold text-[#071A33] shadow-[0_20px_50px_-22px_rgba(218,165,32,0.85)] transition-all hover:brightness-105"
            >
              Explore Business Systems
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MagneticLink>

            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:border-white/30 hover:bg-white/[0.08]"
            >
              <Play className="h-4 w-4 text-accent" />
              See How It Works
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
              Secure instant delivery
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              Documented, reconciling systems
            </span>
          </motion.div>
        </div>

        <HeroComposition />
      </div>

      {/* Cinematic media band — drop the final artwork at HERO_MEDIA.src */}
      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <MaskReveal delay={0.15}>
          <MediaFrame
            src={HERO_MEDIA.src}
            alt={HERO_MEDIA.alt}
            ratio="aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9]"
            sizes="(min-width: 1280px) 1180px, 100vw"
            priority
            label="trueworks · systems workspace"
            fallback={<DashboardPlaceholder variant="overview" />}
          />
        </MaskReveal>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/35">
          <span>Executive KPI dashboard · Financial model · Hospital operations</span>
          <span className="hidden sm:inline">Designed for finance, operations and clinical teams</span>
        </div>
      </div>
    </section>
  );
}