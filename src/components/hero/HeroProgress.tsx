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
  onProgressComplete 
}: HeroProgressProps) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSlides }, (_, index) => (
        <div
          key={index}
          className="relative h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
        >
          {index === currentSlide && autoPlay && (
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E3BC3F] to-[#C9A227] rounded-full"
              variants={progressFill}
              initial="hidden"
              animate="visible"
              key={`progress-${currentSlide}`}
              onAnimationComplete={onProgressComplete}
            />
          )}
          {index < currentSlide && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#E3BC3F] to-[#C9A227] rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
}