'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  canNavigate: boolean;
  size?: 'sm' | 'md';
}

export default function HeroNavigation({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  canNavigate,
  size = 'md',
}: HeroNavigationProps) {
  const isSm = size === 'sm';
  const btnSize = isSm ? 'h-9 w-9' : 'h-12 w-12';
  const iconSize = isSm ? 'h-4 w-4' : 'h-5 w-5';
  const dotActive = isSm ? 'w-6' : 'w-8';
  const dotBase = isSm ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <div className="flex items-center gap-3">
      <motion.button
        className={cn(
          'group relative flex items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300',
          btnSize,
          canNavigate && currentSlide > 0
            ? 'cursor-pointer hover:border-white/25 hover:bg-white/10'
            : 'cursor-not-allowed opacity-40',
        )}
        onClick={canNavigate && currentSlide > 0 ? onPrevious : undefined}
        whileHover={canNavigate && currentSlide > 0 ? { scale: 1.05 } : undefined}
        whileTap={canNavigate && currentSlide > 0 ? { scale: 0.95 } : undefined}
        disabled={!canNavigate || currentSlide === 0}
        aria-label="Previous slide"
      >
        <ChevronLeft className={cn('text-white', iconSize)} />
      </motion.button>

      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: totalSlides }, (_, index) => (
          <motion.span
            key={index}
            className={cn(
              'rounded-full transition-all duration-300',
              dotBase,
              index === currentSlide
                ? cn('bg-accent-light shadow-[0_0_10px_rgba(218,165,32,0.5)]', dotActive)
                : 'bg-white/30',
            )}
            whileHover={index !== currentSlide ? { scale: 1.2 } : undefined}
          />
        ))}
      </div>

      <motion.button
        className={cn(
          'group relative flex items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300',
          btnSize,
          canNavigate && currentSlide < totalSlides - 1
            ? 'cursor-pointer hover:border-white/25 hover:bg-white/10'
            : 'cursor-not-allowed opacity-40',
        )}
        onClick={canNavigate && currentSlide < totalSlides - 1 ? onNext : undefined}
        whileHover={canNavigate && currentSlide < totalSlides - 1 ? { scale: 1.05 } : undefined}
        whileTap={canNavigate && currentSlide < totalSlides - 1 ? { scale: 0.95 } : undefined}
        disabled={!canNavigate || currentSlide === totalSlides - 1}
        aria-label="Next slide"
      >
        <ChevronRight className={cn('text-white', iconSize)} />
      </motion.button>
    </div>
  );
}
