'use client';

import { motion } from 'framer-motion';
import { Target, BarChart3, Brain, Zap } from 'lucide-react';
import { SlideData, featureIcons } from './data';
import { textSlideUp, textFadeIn, featureIconHover, staggerChildren } from './animations';
import HeroButtons from './HeroButtons';

interface HeroContentProps {
  slide: SlideData;
  onExploreClick?: () => void;
  onDemoClick?: () => void;
}

const iconComponents = {
  Target,
  BarChart3,
  Brain,
  Zap
} as const;

export default function HeroContent({ slide, onExploreClick, onDemoClick }: HeroContentProps) {
  return (
    <motion.div 
      className="flex flex-col justify-center h-full px-8 lg:px-16 py-16"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {/* Subtitle with gold highlight */}
      <motion.div 
        className="mb-8"
        variants={textFadeIn}
      >
        <span className="text-[#D4A64A] text-sm font-semibold tracking-wider uppercase">
          Enterprise Business Operating Systems
        </span>
      </motion.div>

      {/* Main heading */}
      <motion.h1 
        className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6"
        variants={textSlideUp}
      >
        <span className="block">{slide.title}</span>
        <span className="block text-[#D4A64A]">{slide.subtitle}</span>
      </motion.h1>

      {/* Description */}
      <motion.p 
        className="text-xl text-white/80 leading-relaxed mb-12 max-w-2xl"
        variants={textFadeIn}
      >
        {slide.description}
      </motion.p>

      {/* CTA Buttons */}
      <motion.div 
        className="mb-16"
        variants={textFadeIn}
      >
        <HeroButtons 
          onExploreClick={onExploreClick}
          onDemoClick={onDemoClick}
        />
      </motion.div>

      {/* Feature Icons */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        variants={staggerChildren}
      >
        {featureIcons.map((feature, index) => {
          const IconComponent = iconComponents[feature.icon as keyof typeof iconComponents];
          
          return (
            <motion.div
              key={feature.name}
              className="group relative"
              variants={featureIconHover}
              initial="rest"
              whileHover="hover"
            >
              <div className="flex flex-col items-center text-center p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20">
                <motion.div
                  className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-[#D4A64A] to-[#B8932E] flex items-center justify-center"
                  whileHover={{ 
                    rotate: 10,
                    scale: 1.1,
                    boxShadow: '0 20px 40px rgba(212, 166, 74, 0.3)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <IconComponent className="w-8 h-8 text-[#081728]" />
                </motion.div>
                
                <h3 className="text-white font-semibold text-lg mb-2">
                  {feature.name}
                </h3>
                
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  initial={{ boxShadow: '0 0 0 rgba(212, 166, 74, 0)' }}
                  whileHover={{ boxShadow: '0 0 30px rgba(212, 166, 74, 0.2)' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}