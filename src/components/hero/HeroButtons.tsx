'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { buttonHover, outlineButtonHover, glowEffect } from './animations';

interface HeroButtonsProps {
  onExploreClick?: () => void;
  onDemoClick?: () => void;
}

export default function HeroButtons({ onExploreClick, onDemoClick }: HeroButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {/* Primary CTA - Explore Solutions */}
      <motion.button
        className="group relative px-8 py-4 bg-gradient-to-r from-[#D4A64A] to-[#B8932E] text-[#081728] font-bold text-lg rounded-xl overflow-hidden transition-all duration-300"
        variants={buttonHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={onExploreClick}
      >
        {/* Button glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#D4A64A] to-[#B8932E] rounded-xl"
          variants={glowEffect}
          initial="rest"
          whileHover="hover"
        />
        
        {/* Button content */}
        <div className="relative flex items-center gap-3">
          <span>Explore Solutions</span>
          <motion.div
            className="overflow-hidden"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>
        
        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.6 }}
        />
      </motion.button>

      {/* Secondary CTA - Watch Demo */}
      <motion.button
        className="group relative px-8 py-4 bg-transparent border-2 border-white/20 text-white font-semibold text-lg rounded-xl overflow-hidden backdrop-blur-sm"
        variants={outlineButtonHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={onDemoClick}
      >
        <div className="relative flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-6 h-6 bg-white/10 rounded-full"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(212, 166, 74, 0.2)' }}
            transition={{ duration: 0.3 }}
          >
            <Play className="w-3 h-3 fill-current" />
          </motion.div>
          <span>Watch Demo</span>
        </div>
        
        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          initial={{ boxShadow: '0 0 0 rgba(212, 166, 74, 0)' }}
          whileHover={{ boxShadow: '0 0 20px rgba(212, 166, 74, 0.3)' }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    </div>
  );
}