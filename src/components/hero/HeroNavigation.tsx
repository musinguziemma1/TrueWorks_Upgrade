'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  canNavigate: boolean;
}

export default function HeroNavigation({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  canNavigate
}: HeroNavigationProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Previous button */}
      <motion.button
        className={`
          group relative flex items-center justify-center w-12 h-12 
          backdrop-blur-xl bg-white/5 border border-white/10 rounded-full
          transition-all duration-300
          ${canNavigate && currentSlide > 0 
            ? 'hover:bg-white/10 hover:border-white/20 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }
        `}
        onClick={canNavigate && currentSlide > 0 ? onPrevious : undefined}
        whileHover={canNavigate && currentSlide > 0 ? { scale: 1.05 } : undefined}
        whileTap={canNavigate && currentSlide > 0 ? { scale: 0.95 } : undefined}
        disabled={!canNavigate || currentSlide === 0}
      >
        <ChevronLeft className="w-5 h-5 text-white" />
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ boxShadow: '0 0 0 rgba(227, 188, 63, 0)' }}
          whileHover={
            canNavigate && currentSlide > 0 
              ? { boxShadow: '0 0 20px rgba(227, 188, 63, 0.3)' }
              : undefined
          }
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Slide indicators */}
      <div className="flex gap-2">
        {Array.from({ length: totalSlides }, (_, index) => (
          <motion.div
            key={index}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentSlide 
                ? 'bg-[#E3BC3F] w-8' 
                : 'bg-white/30 hover:bg-white/50'
              }
            `}
            whileHover={{ scale: index !== currentSlide ? 1.2 : 1 }}
          />
        ))}
      </div>

      {/* Next button */}
      <motion.button
        className={`
          group relative flex items-center justify-center w-12 h-12 
          backdrop-blur-xl bg-white/5 border border-white/10 rounded-full
          transition-all duration-300
          ${canNavigate && currentSlide < totalSlides - 1 
            ? 'hover:bg-white/10 hover:border-white/20 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }
        `}
        onClick={canNavigate && currentSlide < totalSlides - 1 ? onNext : undefined}
        whileHover={canNavigate && currentSlide < totalSlides - 1 ? { scale: 1.05 } : undefined}
        whileTap={canNavigate && currentSlide < totalSlides - 1 ? { scale: 0.95 } : undefined}
        disabled={!canNavigate || currentSlide === totalSlides - 1}
      >
        <ChevronRight className="w-5 h-5 text-white" />
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ boxShadow: '0 0 0 rgba(227, 188, 63, 0)' }}
          whileHover={
            canNavigate && currentSlide < totalSlides - 1 
              ? { boxShadow: '0 0 20px rgba(227, 188, 63, 0.3)' }
              : undefined
          }
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    </div>
  );
}