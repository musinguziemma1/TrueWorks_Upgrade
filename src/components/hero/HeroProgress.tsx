'use client';

import { motion } from 'framer-motion';
import { progressFill } from './animations';

interface HeroProgressProps {
  currentSlide: number;
  totalSlides: number;
  autoPlay: boolean;
  onProgressComplete?: () => void;
}

export default function HeroProgress({
  currentSlide,
  totalSlides,
  autoPlay,
  onProgressComplete,
}: HeroProgressProps) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={totalSlides} aria-valuenow={currentSlide + 1}>
      {Array.from({ length: totalSlides }, (_, index) => (
        <div
          key={index}
          className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/15"
        >
          {index === currentSlide && autoPlay && (
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-dark"
              variants={progressFill}
              initial="hidden"
              animate="visible"
              key={`progress-${currentSlide}`}
              onAnimationComplete={onProgressComplete}
            />
          )}
          {index < currentSlide && (
            <div className="absolute inset-0 rounded-full bg-accent-light/80" />
          )}
        </div>
      ))}
    </div>
  );
}
