'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target, BarChart3, Brain, Zap, TrendingUp, ArrowUpRight } from 'lucide-react';
import { SlideData, featureIcons } from './data';
import { textSlideUp, textFadeIn, staggerChildren } from './animations';
import HeroButtons from './HeroButtons';

interface HeroContentProps {
  slide: SlideData;
  onExploreClick?: () => void;
  onDemoClick?: () => void;
}

const iconComponents = {
  Target,
  BarChart3,
  Brain,
  Zap
} as const;

const themeBadge: Record<SlideData['theme'], { icon: typeof Target; label: string }> = {
  finance: { icon: TrendingUp, label: 'Finance & executive' },
  operations: { icon: BarChart3, label: 'Operations & integration' },
  healthcare: { icon: Target, label: 'Healthcare analytics' },
  manufacturing: { icon: Zap, label: 'Manufacturing' },
  government: { icon: Brain, label: 'Government & public sector' },
};

export default function HeroContent({ slide, onExploreClick, onDemoClick }: HeroContentProps) {
  const Badge = themeBadge[slide.theme];

  return (
    <motion.div
      className="flex h-full flex-col justify-center px-6 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto w-full max-w-2xl">
        {/* Eyebrow + theme tag */}
        <motion.div className="mb-6 flex flex-wrap items-center gap-3" variants={textFadeIn}>
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-light">
            Enterprise Business Operating Systems
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block" />
          <AnimatePresence mode="wait">
            <motion.span
              key={slide.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-light backdrop-blur"
            >
              <Badge.icon className="h-3 w-3" />
              {Badge.label}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="font-heading text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl"
          variants={textSlideUp}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={slide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="block"
            >
              <span className="block">{slide.title}</span>
              <span className="block text-gradient-gold">{slide.subtitle}</span>
            </motion.span>
          </AnimatePresence>
        </motion.h1>

        {/* Description */}
        <AnimatePresence mode="wait">
          <motion.p
            key={slide.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            {slide.description}
          </motion.p>
        </AnimatePresence>

        {/* CTAs */}
        <motion.div className="mt-9" variants={textFadeIn}>
          <HeroButtons onExploreClick={onExploreClick} onDemoClick={onDemoClick} />
        </motion.div>

        {/* Feature badges (slim row) */}
        <motion.div
          className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3"
          variants={staggerChildren}
        >
          {featureIcons.map((feature) => {
            const IconComponent =
              iconComponents[feature.icon as keyof typeof iconComponents];
            return (
              <motion.div
                key={feature.name}
                className="group flex items-center gap-2.5"
                variants={textFadeIn}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-light ring-1 ring-accent/25 transition-all group-hover:scale-110 group-hover:bg-accent/25 group-hover:ring-accent/40">
                  <IconComponent className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light">
                    {feature.name}
                  </p>
                  <p className="text-xs text-white/65">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Mobile KPI strip — visible only on small screens (lg:hidden) */}
        <motion.div
          className="mt-10 grid grid-cols-2 gap-3 lg:hidden"
          variants={staggerChildren}
          aria-label="Key metrics"
        >
          {slide.kpis.slice(0, 4).map((kpi) => (
            <motion.div
              key={kpi.label}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur"
              variants={textFadeIn}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                {kpi.label}
              </p>
              <p className="mt-1 font-heading text-xl font-semibold text-white">
                {kpi.value}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-300">
                {kpi.change}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile "view more" hint */}
        <motion.div
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light lg:hidden"
          variants={textFadeIn}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          Scroll to explore
        </motion.div>
      </div>
    </motion.div>
  );
}
