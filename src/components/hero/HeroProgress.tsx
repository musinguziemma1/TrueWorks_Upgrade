'use client';

import { motion } from 'framer-motion';
import { progressFill } from './animations';

interface HeroProgressProps {
  currentSlide: number;
  totalSlides: number;
  autoPlay: boolean;
  /** Must match the slider's auto-play interval so the bar fills exactly once per slide. */
  duration?: number;
  onProgressComplete?: () => void;
}

export default function HeroProgress({ 
  currentSlide, 
  totalSlides, 
  autoPlay,
  duration = 8,
  onProgressComplete 
}: HeroProgressProps) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSlides }, (_, index) => (
        <div
          key={index}
          className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20"
        >
          {index === currentSlide && autoPlay && (
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#DAA520] to-[#B8860B]"
              variants={progressFill(duration)}
              initial="hidden"
              animate="visible"
              key={`progress-${currentSlide}`}
              onAnimationComplete={onProgressComplete}
            />
          )}
          {index < currentSlide && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#DAA520] to-[#B8860B]" />
          )}
        </div>
      ))}
    </div>
  );
}