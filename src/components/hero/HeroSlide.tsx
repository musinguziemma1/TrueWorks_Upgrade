'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { SlideData } from './data';
import { slideTransition, kenBurnsEffect } from './animations';
import FloatingKPICards from './FloatingKPICards';

interface HeroSlideProps {
  slide: SlideData;
  isActive: boolean;
}

export default function HeroSlide({ slide, isActive }: HeroSlideProps) {
  // Generate the visual based on slide type
  const renderVisual = () => {
    switch (slide.visualType) {
      case 'executive':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Executive workspace */}
            <div className="relative w-[600px] h-[400px] perspective-1000">
              {/* MacBook mockup */}
              <motion.div
                className="relative w-full h-full"
                variants={kenBurnsEffect}
                initial="initial"
                animate={isActive ? "animate" : "initial"}
              >
                {/* Laptop screen */}
                <div className="relative w-full h-80 bg-gradient-to-b from-gray-900 to-black rounded-t-2xl border-4 border-gray-700 overflow-hidden">
                  {/* Dashboard content */}
                  <div className="p-6 h-full bg-gradient-to-br from-[#04101F] to-[#071A33]">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#E3BC3F] rounded-lg flex items-center justify-center">
                          <span className="text-[#04101F] font-bold text-sm">TW</span>
                        </div>
                        <span className="text-white font-semibold">TrueWorks BOS</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Live Dashboard
                      </div>
                    </div>
                    
                    {/* KPI Grid */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {slide.kpis.map((kpi, index) => (
                        <motion.div
                          key={kpi.label}
                          className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                          initial={{ opacity: 0, y: 10 }}
                          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <div className="text-xs text-white/60 mb-1">{kpi.label}</div>
                          <div className="text-lg font-bold text-white">{kpi.value}</div>
                          <div className={`text-xs ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {kpi.change}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Chart area */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white text-sm">Revenue Trend</span>
                        <span className="text-green-400 text-xs">↑ 24.7%</span>
                      </div>
                      <div className="flex items-end gap-1 h-16">
                        {Array.from({ length: 12 }, (_, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-[#E3BC3F] to-[#C9A227] rounded-sm"
                            initial={{ height: 0 }}
                            animate={isActive ? { height: `${Math.random() * 60 + 20}%` } : { height: 0 }}
                            transition={{ delay: 1 + i * 0.05 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Laptop base */}
                <div className="w-full h-8 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-2xl" />
                <div className="w-32 h-2 bg-gray-600 rounded-b-lg mx-auto" />
              </motion.div>
            </div>
          </div>
        );
        
      case 'operations':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Large wall display */}
            <div className="relative w-[700px] h-[400px]">
              <motion.div
                className="w-full h-full bg-gradient-to-br from-[#04101F] to-[#071A33] rounded-3xl border-8 border-gray-800 overflow-hidden"
                variants={kenBurnsEffect}
                initial="initial"
                animate={isActive ? "animate" : "initial"}
              >
                {/* Operations dashboard */}
                <div className="p-8 h-full">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Operations Command Center</h3>
                    <p className="text-white/60">Real-time Enterprise Monitoring</p>
                  </div>
                  
                  {/* Module grid */}
                  <div className="grid grid-cols-4 gap-4">
                    {slide.modules.map((module, index) => (
                      <motion.div
                        key={module.name}
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                            module.status === 'success' ? 'bg-green-500/20 text-green-400' :
                            module.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            <div className="w-6 h-6 bg-current rounded opacity-60" />
                          </div>
                          <div className="text-white text-sm font-medium mb-1">{module.name}</div>
                          <div className="text-xs text-white/60">{module.value}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Default dashboard layout */}
            <div className="relative w-[600px] h-[350px] bg-gradient-to-br from-[#04101F] to-[#071A33] rounded-2xl border border-white/10 overflow-hidden">
              <motion.div
                className="p-6 h-full"
                variants={kenBurnsEffect}
                initial="initial"
                animate={isActive ? "animate" : "initial"}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white capitalize">{slide.theme} Analytics</h3>
                  <p className="text-white/60 text-sm">Enterprise Performance Dashboard</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {slide.kpis.slice(0, 4).map((kpi, index) => (
                    <motion.div
                      key={kpi.label}
                      className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ delay: 0.6 + index * 0.15 }}
                    >
                      <div className="text-xs text-white/60 mb-2">{kpi.label}</div>
                      <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
                      <div className={`text-sm ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {kpi.change}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        );
    }
  };

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
          {/* Background glow effect based on theme */}
          <div 
            className={`absolute inset-0 opacity-30 ${
              slide.theme === 'finance' ? 'bg-gradient-radial from-[#E3BC3F]/20' :
              slide.theme === 'operations' ? 'bg-gradient-radial from-blue-500/20' :
              slide.theme === 'healthcare' ? 'bg-gradient-radial from-green-500/20' :
              slide.theme === 'manufacturing' ? 'bg-gradient-radial from-orange-500/20' :
              'bg-gradient-radial from-purple-500/20'
            }`}
          />
          
          {/* Main visual */}
          <div className="relative w-full h-full flex items-center justify-center">
            {renderVisual()}
          </div>
          
          {/* Floating KPI cards */}
          <FloatingKPICards kpis={slide.kpis} isVisible={isActive} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}