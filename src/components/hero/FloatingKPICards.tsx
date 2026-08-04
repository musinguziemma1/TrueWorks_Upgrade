'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPI } from './data';
import { floatingCard, counterAnimation } from './animations';

interface FloatingKPICardsProps {
  kpis: KPI[];
  isVisible: boolean;
}

export default function FloatingKPICards({ kpis, isVisible }: FloatingKPICardsProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top right KPI */}
      <motion.div
        className="absolute top-12 right-8 w-64 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl"
        variants={floatingCard}
        initial="initial"
        animate={isVisible ? "animate" : "initial"}
        style={{ translateZ: 0 }} // Force hardware acceleration
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-body text-white/70 text-sm font-medium">{kpis[0]?.label}</h4>
          <div className={`flex items-center gap-1 ${getTrendColor(kpis[0]?.trend || 'neutral')}`}>
            {getTrendIcon(kpis[0]?.trend || 'neutral')}
            <span className="text-xs font-semibold">{kpis[0]?.change}</span>
          </div>
        </div>
        <motion.div 
          className="font-heading text-2xl font-bold text-white"
          variants={counterAnimation}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {kpis[0]?.value}
        </motion.div>
        <div 
          className="h-1 rounded-full mt-3 opacity-60"
          style={{ backgroundColor: kpis[0]?.color }}
        />
      </motion.div>

      {/* Middle left KPI */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 left-8 w-56 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl"
        variants={floatingCard}
        initial="initial"
        animate={isVisible ? "animate" : "initial"}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-body text-white/70 text-sm font-medium">{kpis[1]?.label}</h4>
          <div className={`flex items-center gap-1 ${getTrendColor(kpis[1]?.trend || 'neutral')}`}>
            {getTrendIcon(kpis[1]?.trend || 'neutral')}
            <span className="text-xs font-semibold">{kpis[1]?.change}</span>
          </div>
        </div>
        <motion.div 
          className="font-heading text-2xl font-bold text-white"
          variants={counterAnimation}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {kpis[1]?.value}
        </motion.div>
        <div 
          className="h-1 rounded-full mt-3 opacity-60"
          style={{ backgroundColor: kpis[1]?.color }}
        />
      </motion.div>

      {/* Bottom right KPI */}
      <motion.div
        className="absolute bottom-16 right-12 w-60 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl"
        variants={floatingCard}
        initial="initial"
        animate={isVisible ? "animate" : "initial"}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-body text-white/70 text-sm font-medium">{kpis[2]?.label}</h4>
          <div className={`flex items-center gap-1 ${getTrendColor(kpis[2]?.trend || 'neutral')}`}>
            {getTrendIcon(kpis[2]?.trend || 'neutral')}
            <span className="text-xs font-semibold">{kpis[2]?.change}</span>
          </div>
        </div>
        <motion.div 
          className="font-heading text-2xl font-bold text-white"
          variants={counterAnimation}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {kpis[2]?.value}
        </motion.div>
        <div 
          className="h-1 rounded-full mt-3 opacity-60"
          style={{ backgroundColor: kpis[2]?.color }}
        />
      </motion.div>

      {/* Top left smaller KPI */}
      <motion.div
        className="absolute top-20 left-12 w-48 p-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-2xl"
        variants={floatingCard}
        initial="initial"
        animate={isVisible ? "animate" : "initial"}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-body text-white/70 text-xs font-medium">{kpis[3]?.label}</h4>
          <div className={`flex items-center gap-1 ${getTrendColor(kpis[3]?.trend || 'neutral')}`}>
            {getTrendIcon(kpis[3]?.trend || 'neutral')}
            <span className="text-xs font-semibold">{kpis[3]?.change}</span>
          </div>
        </div>
        <motion.div 
          className="font-heading text-xl font-bold text-white"
          variants={counterAnimation}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {kpis[3]?.value}
        </motion.div>
        <div 
          className="h-0.5 rounded-full mt-2 opacity-60"
          style={{ backgroundColor: kpis[3]?.color }}
        />
      </motion.div>
    </div>
  );
}