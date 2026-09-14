'use client';

import { motion } from 'framer-motion';

interface HeroIndicatorsProps {
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (index: number) => void;
  slideLabels: string[];
}

export default function HeroIndicators({
  currentSlide,
  totalSlides,
  onSlideChange,
  slideLabels
}: HeroIndicatorsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a template showcase">
      {Array.from({ length: totalSlides }, (_, index) => {
        const isActive = index === currentSlide;

        return (
          <motion.button
            key={index}
            type="button"
            aria-pressed={isActive}
            aria-label={`Show ${slideLabels[index]}`}
            className={`
              group relative flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all duration-300
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAA520] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04101F]
              ${isActive
                ? 'border border-white/20 bg-white/10 backdrop-blur-xl'
                : 'border border-transparent backdrop-blur-sm hover:border-white/10 hover:bg-white/5'
              }
            `}
            onClick={() => onSlideChange(index)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Indicator dot */}
            <motion.div
              className={`
                h-2.5 w-2.5 rounded-full transition-all duration-300
                ${isActive
                  ? 'bg-[#DAA520] shadow-[0_0_12px_rgba(218,165,32,0.8)]'
                  : 'bg-white/30 group-hover:bg-white/50'
                }
              `}
              animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Label */}
            <span
              className={`
                font-body text-xs font-medium transition-all duration-300
                ${isActive
                  ? 'text-white'
                  : 'text-white/70 group-hover:text-white/90'
                }
              `}
            >
              {slideLabels[index]}
            </span>

            {/* Active indicator line */}
            {isActive && (
              <motion.div
                className="absolute inset-y-0 left-0 w-1 rounded-r bg-gradient-to-b from-[#DAA520] to-[#B8860B]"
                layoutId="activeIndicator"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* Glow effect on hover */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-lg"
              initial={{ boxShadow: '0 0 0 rgba(227, 188, 63, 0)' }}
              whileHover={{ boxShadow: '0 0 20px rgba(227, 188, 63, 0.16)' }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}