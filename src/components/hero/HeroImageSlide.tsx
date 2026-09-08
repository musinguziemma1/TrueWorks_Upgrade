'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideData } from './data';
import { slideTransition, kenBurnsEffect } from './animations';

interface HeroImageSlideProps {
  slide: SlideData;
  isActive: boolean;
}

const heroImages: Record<SlideData['id'], string> = {
  'executive-finance': '/images/hero/hero-1.png',
  'corporate-operations': '/images/hero/hero-2.png',
  'healthcare-analytics': '/images/hero/hero-3.png',
  'manufacturing-ops': '/images/hero/hero-4.png',
  'government-monitoring': '/images/hero/hero-4.png',
};

const themeGlow: Record<SlideData['theme'], string> = {
  finance: 'from-[#DAA520]/20 via-[#0b2545]/10',
  operations: 'from-[#3E6990]/25 via-[#0b2545]/10',
  healthcare: 'from-emerald-400/15 via-[#0b2545]/10',
  manufacturing: 'from-orange-400/15 via-[#0b2545]/10',
  government: 'from-violet-400/15 via-[#0b2545]/10',
};

export default function HeroImageSlide({ slide, isActive }: HeroImageSlideProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          className="absolute inset-0"
          variants={slideTransition}
          initial="hidden"
          animate="visible"
          exit="exit"
          key={slide.id}
        >
          <div className={`absolute inset-0 bg-gradient-radial ${themeGlow[slide.theme]} to-transparent opacity-70`} />

          <div className="relative flex h-full w-full items-center justify-center px-4 py-10 sm:px-8 lg:px-3 xl:px-8">
            <motion.div
              className="relative aspect-[3/2] w-full max-w-[760px]"
              variants={kenBurnsEffect}
              initial="initial"
              animate="animate"
              data-parallax="0.7"
            >
              <div className="absolute inset-[7%] rounded-full bg-[#DAA520]/10 blur-3xl" />
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
                <Image
                  src={heroImages[slide.id]}
                  alt={`${slide.title} TrueWorks dashboard workspace`}
                  fill
                  priority={slide.id === 'executive-finance'}
                  sizes="(max-width: 1024px) 90vw, 48vw"
                  className="object-contain drop-shadow-[0_24px_28px_rgba(0,0,0,0.28)]"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-[12%] bottom-[3%] h-5 rounded-full bg-black/30 blur-xl" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
