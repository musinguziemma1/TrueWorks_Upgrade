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
    <div className="flex flex-col gap-3">
      {Array.from({ length: totalSlides }, (_, index) => (
        <motion.button
          key={index}
          className={`
            group relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300
            ${index === currentSlide 
              ? 'bg-white/10 backdrop-blur-xl border border-white/20' 
              : 'hover:bg-white/5 backdrop-blur-sm border border-transparent hover:border-white/10'
            }
          `}
          onClick={() => onSlideChange(index)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Indicator dot */}
          <motion.div
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${index === currentSlide 
                ? 'bg-[#D4A64A] shadow-lg' 
                : 'bg-white/30 group-hover:bg-white/50'
              }
            `}
            animate={index === currentSlide ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Label */}
          <span 
            className={`
              text-sm font-medium transition-all duration-300
              ${index === currentSlide 
                ? 'text-white' 
                : 'text-white/60 group-hover:text-white/80'
              }
            `}
          >
            {slideLabels[index]}
          </span>
          
          {/* Active indicator line */}
          {index === currentSlide && (
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#D4A64A] to-[#B8932E] rounded-r"
              layoutId="activeIndicator"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ boxShadow: '0 0 0 rgba(212, 166, 74, 0)' }}
            whileHover={{ boxShadow: '0 0 20px rgba(212, 166, 74, 0.1)' }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      ))}
    </div>
  );
}