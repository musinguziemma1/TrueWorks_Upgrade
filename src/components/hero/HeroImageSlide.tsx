'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Download, FileSpreadsheet, Lock, Table2 } from 'lucide-react';
import { SlideData } from './data';
import { slideTransition, kenBurnsEffect, themeGlowHex } from './animations';

interface HeroImageSlideProps {
  slide: SlideData;
  isActive: boolean;
  /**
   * Only the primary (desktop) instance should preload — the condensed mobile
   * instance renders the same asset and would otherwise double-fetch it.
   */
  priority?: boolean;
}

const SHEET_TABS = ['Summary', 'Data', 'Charts'];

/** `=AVERAGE(Bed_Occupancy_Tracker)` — a plausible formula for the workbook shown. */
function formulaFor(slide: SlideData): string {
  const ref = slide.modules[0]?.name.replace(/[^A-Za-z0-9]+/g, '_') ?? 'Summary';
  return `=AVERAGE(${ref})`;
}

/** Title bar: traffic lights + workbook name, so the screenshot reads as real software. */
function WindowTitleBar({ slide }: { slide: SlideData }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.07] px-3.5 py-2.5 backdrop-blur-md sm:px-4">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/85" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/85" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/85" />
      </div>
      <div className="ml-1 flex min-w-0 items-center gap-2 rounded-md bg-black/30 px-2.5 py-1 ring-1 ring-white/10">
        <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <span className="truncate font-mono text-[11px] tracking-tight text-white/80">
          {slide.fileName}
        </span>
      </div>
      <div className="ml-auto hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 ring-1 ring-white/10 sm:flex">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: slide.accent }} />
        Live
      </div>
    </div>
  );
}

/** Formula bar — the small authentic detail that makes the frame feel like a spreadsheet. */
function FormulaBar({ slide }: { slide: SlideData }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.035] px-3.5 py-1.5 sm:px-4">
      <span className="font-mono text-[10px] text-white/45">A1</span>
      <span className="h-3.5 w-px bg-white/15" aria-hidden="true" />
      <span className="font-mono text-[10px] italic text-white/40">fx</span>
      <span className="truncate font-mono text-[10px] text-white/55">{formulaFor(slide)}</span>
      <span className="ml-auto hidden items-center gap-1 text-[10px] text-white/35 sm:flex">
        <Table2 className="h-3 w-3" />
        Sheet1
      </span>
    </div>
  );
}

/** Excel-style sheet tabs pinned to the bottom of the workbook body. */
function SheetTabs({ slide }: { slide: SlideData }) {
  return (
    <div className="flex items-center gap-1 border-t border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-md">
      {SHEET_TABS.map((tab, i) => (
        <span
          key={tab}
          className={`rounded-t-md px-2.5 py-1 font-mono text-[10px] tracking-tight ${
            i === 0 ? 'text-white/90' : 'text-white/40'
          }`}
          style={i === 0 ? { backgroundColor: `${slide.accent}26`, boxShadow: `inset 0 -2px 0 ${slide.accent}` } : undefined}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}

/** Status bar carrying the purchase assurances. */
function StatusBar({ slide }: { slide: SlideData }) {
  const separator = <span className="text-white/20" aria-hidden="true">•</span>;
  return (
    <div className="flex items-center gap-2 border-t border-white/10 bg-white/[0.07] px-3.5 py-2 text-[10px] text-white/55 backdrop-blur-md sm:px-4">
      <span className="flex items-center gap-1.5 text-white/75">
        <Check className="h-3 w-3" style={{ color: slide.accent }} />
        Ready to deploy
      </span>
      <span className="hidden sm:inline-flex">{separator}</span>
      <span className="hidden sm:inline">Excel + Google Sheets</span>
      <span className="hidden md:inline-flex">{separator}</span>
      <span className="hidden md:inline">Pay once</span>
      <span className="ml-auto flex items-center gap-1.5 text-white/45">
        <Lock className="h-3 w-3" />
        Lifetime access
      </span>
    </div>
  );
}


/**
 * Branded preview for slides that have no screenshot asset yet (and a graceful
 * fallback if a product image ever fails to load). Composed from the slide's own
 * KPI + module data so it always stays in sync with the copy.
 */
function ComposedPreview({ slide }: { slide: SlideData }) {
  return (
    <div className="absolute inset-0 flex flex-col gap-3 p-4 sm:p-6">
      <div className="flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2 ring-1 ring-white/10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
          {slide.eyebrow}
        </span>
        <span className="font-mono text-[10px] text-white/40">Monthly view</span>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3">
        {slide.kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-3"
          >
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">{kpi.label}</span>
            <div className="flex items-end gap-2">
              <span className="font-heading text-2xl font-semibold leading-none text-white">
                {kpi.value}
              </span>
              <span className="mb-0.5 text-[10px] font-semibold" style={{ color: kpi.color }}>
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="divide-y divide-white/[0.07] rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1">
        {slide.modules.map((module) => (
          <div key={module.name} className="flex items-center gap-2.5 py-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: module.status === 'active' ? slide.accent : '#10B981' }}
            />
            <span className="truncate text-[11px] text-white/70">{module.name}</span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-white/40">{module.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroImageSlide({ slide, isActive, priority = false }: HeroImageSlideProps) {
  const glow = themeGlowHex[slide.theme];
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(slide.image) && !imageFailed;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          className="absolute inset-0"
          variants={slideTransition}
          initial="hidden"
          animate="visible"
          exit="exit"
          key={slide.id}
        >
          <div className="relative flex h-full w-full items-center justify-center px-4 py-10 sm:px-8 lg:px-3 xl:px-8">
            <motion.div
              className="relative w-full max-w-[860px]"
              variants={kenBurnsEffect}
              initial="initial"
              animate="animate"
              data-parallax="0.7"
            >
              {/* Themed bloom behind the frame — inline radial-gradient because
                  `bg-gradient-radial` is not a real Tailwind v4 utility. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10 transition-colors duration-700"
                style={{
                  background: `radial-gradient(60% 55% at 50% 45%, ${glow}30 0%, transparent 70%)`
                }}
              />

              {/* Floating deploy chip */}
              <motion.div
                className="absolute -top-3 -left-3 z-20 hidden items-center gap-2 rounded-xl border border-white/15 bg-[#08131F]/85 px-3 py-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md sm:flex"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                data-parallax="1.2"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${slide.accent}26`, color: slide.accent }}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-white">
                  Instant download
                  <span className="block text-[10px] font-normal text-white/45">.xlsx included</span>
                </span>
              </motion.div>

              {/* Excel window frame */}
              <div
                className="relative flex aspect-[16/11] w-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0B1929]/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)] backdrop-blur-sm transition-shadow duration-700"
                style={{ boxShadow: `0 40px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px ${glow}26` }}
              >
                <WindowTitleBar slide={slide} />
                <FormulaBar slide={slide} />

                <div className="relative min-h-0 w-full flex-1">
                  {showImage ? (
                    <motion.div className="absolute inset-0" variants={kenBurnsEffect} initial="initial" animate="animate">
                      <Image
                        src={slide.image as string}
                        alt={`${slide.title} ${slide.subtitle} — ${slide.fileName} preview`}
                        fill
                        priority={priority && slide.id === 'hospital-kpi'}
                        sizes="(max-width: 1024px) 92vw, 46vw"
                        className="object-contain object-center p-2 drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)] sm:p-3"
                        onError={() => setImageFailed(true)}
                      />
                    </motion.div>
                  ) : (
                    <ComposedPreview slide={slide} />
                  )}
                </div>

                <SheetTabs slide={slide} />
                <StatusBar slide={slide} />
              </div>

              {/* Floor reflection + contact shadow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 -bottom-1 h-16 rounded-[50%] bg-black/45 blur-2xl"
              />

              {/* Colour seam tying the frame to the page */}
              <div
                aria-hidden="true"
                className="absolute inset-x-10 -bottom-px h-px transition-colors duration-700"
                style={{ background: `linear-gradient(90deg, transparent, ${glow}CC, transparent)` }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
