'use client';

import { motion } from 'framer-motion';
import { floatingParticle } from './animations';

const particles = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  size: 3 + ((i * 7) % 6),
  delay: (i * 0.4) % 5,
  duration: 15 + ((i * 3) % 10),
  isGold: i % 5 === 0
}));

const lightBeams = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  rotation: i * 45,
  delay: i * 1.5
}));

const orbs = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  x: (i * 23 + 11) % 100,
  y: (i * 31 + 17) % 100,
  size: 80 + ((i * 13) % 80),
  duration: 24 + ((i * 5) % 12),
  delay: i * 1.7,
  isGold: i % 2 === 0
}));

const rings = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  x: 18 + i * 30,
  y: 25 + ((i * 19) % 50),
  delay: i * 3,
  duration: 9 + i * 2
}));

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#04101F] via-[#071A33] to-[#04101F]" />

      <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#DAA520]/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/8 blur-3xl" />

      {orbs.map((o) => (
        <motion.div
          key={`orb-${o.id}`}
          className={`absolute rounded-full blur-2xl ${o.isGold ? 'bg-accent/[0.10]' : 'bg-blue-400/[0.10]'}`}
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: o.size,
            height: o.size
          }}
          animate={{
            x: [-30, 30, -30],
            y: [-40, 40, -40],
            opacity: [0.5, 0.9, 0.5],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: o.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: o.delay
          }}
        />
      ))}

      {lightBeams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.18, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: beam.delay,
            ease: 'easeInOut'
          }}
          style={{ rotate: beam.rotation }}
        >
          <div className="w-[3px] h-full bg-gradient-to-b from-transparent via-white/25 to-transparent mx-auto" />
        </motion.div>
      ))}

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.isGold ? 'bg-accent-light' : 'bg-white'}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            boxShadow: particle.isGold
              ? `0 0 ${particle.size * 2}px ${particle.size}px rgba(218,165,32,0.35)`
              : `0 0 ${particle.size * 2}px ${particle.size}px rgba(255,255,255,0.25)`,
            opacity: 0.7
          }}
          animate={floatingParticle(particle.delay, particle.duration)}
        />
      ))}

      {rings.map((r) => (
        <motion.div
          key={`ring-${r.id}`}
          className="absolute rounded-full border border-accent-light/25"
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: 80,
            height: 80,
            marginLeft: -40,
            marginTop: -40
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 2.4], opacity: [0, 0.45, 0] }}
          transition={{
            duration: r.duration,
            repeat: Infinity,
            ease: 'easeOut',
            delay: r.delay
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px'
        }}
      />

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#04101F]/80" />
    </div>
  );
}
