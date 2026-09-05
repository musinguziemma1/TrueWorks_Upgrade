'use client';

import { motion } from 'framer-motion';
import { floatingParticle } from './animations';

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 5,
  duration: Math.random() * 10 + 15
}));

const lightBeams = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  rotation: Math.random() * 360,
  delay: Math.random() * 3
}));

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#04101F] via-[#071A33] to-[#04101F]" />
      
      {/* Spotlight effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#DAA520] rounded-full blur-3xl opacity-5" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-3" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-2" />
      
      {/* Animated light beams */}
      {lightBeams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: beam.delay,
            ease: 'easeInOut'
          }}
          style={{ rotate: beam.rotation }}
        >
          <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent mx-auto" />
        </motion.div>
      ))}
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          animate={floatingParticle(particle.delay, particle.duration)}
        />
      ))}
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px'
        }}
      />
      
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#04101F]/80" />
    </div>
  );
}