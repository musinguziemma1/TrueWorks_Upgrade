'use client';

import { motion } from 'framer-motion';

interface HeroIndicatorsProps {
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (index: number) => void;
  slideLabels: string[];
}

const labelMap: Record<string, string> = {
  finance: 'Finance & executive',
  operations: 'Operations & integration',
  healthcare: 'Healthcare analytics',
  manufacturing: 'Smart manufacturing',
  government: 'Government & public sector',
};

export default function HeroIndicators({
  currentSlide,
  totalSlides,
  onSlideChange,
  slideLabels,
}: HeroIndicatorsProps) {
  return (
    <div className="flex flex-col gap-1.5" role="tablist" aria-label="Hero slides">
      {Array.from({ length: totalSlides }, (_, index) => {
        const active = index === currentSlide;
        return (
          <motion.button
            key={index}
            role="tab"
            aria-selected={active}
            className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-300 ${
              active
                ? 'border-white/20 bg-white/[0.08] backdrop-blur-xl'
                : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
            }`}
            onClick={() => onSlideChange(index)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span
              className={`shrink-0 rounded-full transition-all duration-300 ${
                active
                  ? 'h-2.5 w-2.5 bg-accent-light shadow-[0_0_10px_rgba(218,165,32,0.5)]'
                  : 'h-2 w-2 bg-white/30 group-hover:bg-white/50'
              }`}
              animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={active ? { duration: 2, repeat: Infinity } : { duration: 0.2 }}
            />
            <span
              className={`font-body text-sm font-medium transition-colors ${
                active ? 'text-white' : 'text-white/70 group-hover:text-white/85'
              }`}
            >
              {labelMap[slideLabels[index]] ?? slideLabels[index]}
            </span>
            {active && (
              <motion.span
                className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-gradient-to-b from-accent-light to-accent-dark"
                layoutId="activeHeroIndicator"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
