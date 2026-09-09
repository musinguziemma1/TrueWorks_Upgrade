'use client';

import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { heroSlides, SlideData } from './data';
import { textSlideUp, textFadeIn, staggerChildren } from './animations';
import HeroButtons from './HeroButtons';

interface HeroContentProps {
  slide: SlideData;
  onExploreClick?: () => void;
  onDemoClick?: () => void;
}

export default function HeroContent({ slide, onExploreClick, onDemoClick }: HeroContentProps) {
  const slideNumber = heroSlides.findIndex(({ id }) => id === slide.id) + 1;

  return (
    <motion.div
      className="flex h-full flex-col justify-center px-8 py-16 sm:px-12 lg:px-16 xl:px-20"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-2xl">
        <motion.div className="mb-7 flex items-center justify-between gap-4" variants={textFadeIn}>
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#DAA520]">
            <span className="h-px w-8 bg-[#DAA520]" />
            <span>TrueWorks / {slide.theme}</span>
          </div>
          <span className="font-mono text-xs tracking-[0.2em] text-white/40">
            0{slideNumber} / 0{heroSlides.length}
          </span>
        </motion.div>

        <motion.div className="mb-6 max-w-xl" variants={textSlideUp}>
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-white/55">
            <Activity className="h-4 w-4 text-[#DAA520]" />
            Enterprise business operating systems
          </p>
          <h1 className="font-heading text-5xl font-bold leading-[0.98] tracking-tight text-white sm:text-6xl xl:text-7xl">
            <span className="block">{slide.title}</span>
            <span className="block text-[#DAA520]">{slide.subtitle}</span>
          </h1>
        </motion.div>

        <motion.p
          className="mb-9 max-w-xl text-base leading-7 text-white/70 sm:text-lg"
          variants={textFadeIn}
        >
          {slide.description}
        </motion.p>

        <motion.div className="mb-10" variants={textFadeIn}>
          <HeroButtons
            onExploreClick={onExploreClick}
            onDemoClick={onDemoClick}
          />
        </motion.div>

        <motion.div className="border-y border-white/10" variants={textFadeIn}>
          <div className="grid grid-cols-2 divide-x divide-white/10">
            {slide.kpis.slice(0, 2).map((kpi) => (
              <div key={kpi.label} className="py-4 pr-5 first:pl-0 last:pl-5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  {kpi.label}
                </p>
                <div className="flex items-end gap-2">
                  <span className="font-heading text-2xl font-semibold text-white">{kpi.value}</span>
                  <span className="mb-1 text-xs font-semibold" style={{ color: kpi.color }}>
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 py-3 text-xs text-white/55">
            {slide.modules.slice(0, 2).map((module) => (
              <span key={module.name} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#DAA520]" />
                {module.name}
              </span>
            ))}
            <span className="ml-auto hidden items-center gap-1.5 text-white/35 sm:flex">
              View capability
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
