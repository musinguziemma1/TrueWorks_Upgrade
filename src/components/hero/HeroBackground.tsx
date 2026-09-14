'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { floatingParticle, heroThemes, themeGrade, themeGlowHex } from './animations';
import type { SlideData } from './data';

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  size: 2 + ((i * 7) % 3),
  delay: (i * 0.4) % 5,
  duration: 16 + ((i * 3) % 10),
  isGold: i % 5 === 0
}));

const lightBeams = Array.from({ length: 2 }, (_, i) => ({
  id: i,
  rotation: i * 60 + 20,
  delay: i * 2
}));

const orbs = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  x: (i * 31 + 11) % 100,
  y: (i * 29 + 17) % 100,
  size: 120 + ((i * 37) % 120),
  duration: 26 + ((i * 5) % 12),
  delay: i * 1.7,
  isGold: i % 2 === 0
}));

export default function HeroBackground({ theme }: { theme: SlideData['theme'] }) {
  const glow = themeGlowHex[theme];
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/*
        Per-slide cinematic grade. All themes are stacked and crossfaded with
        opacity because CSS cannot transition a background-image — this keeps
        the mood shift smooth instead of snapping when the slide changes.
      */}
      {heroThemes.map((t) => (
        <div
          key={t}
          aria-hidden="true"
          className={`absolute inset-0 bg-gradient-to-br ${themeGrade[t]} transition-opacity duration-[1200ms] ease-out`}
          style={{ opacity: t === theme ? 1 : 0 }}
        />
      ))}

      {/* Dashboard grid mesh — fades out towards the edges so it reads as depth, not texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(115% 85% at 50% 15%, #000 15%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(115% 85% at 50% 15%, #000 15%, transparent 72%)'
        }}
      />

      {/* Theme halo (top-left) + gold halo (bottom-right) */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full blur-3xl transition-colors duration-1000"
        style={{ backgroundColor: `${glow}1A` }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-[#DAA520]/[0.07] blur-3xl"
      />

      {/* Spotlight behind the product frame so the screenshot pops off the navy */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 hidden h-[36rem] w-[36rem] -translate-y-1/2 translate-x-[15%] rounded-full blur-3xl transition-colors duration-1000 lg:block"
        style={{ backgroundColor: `${glow}14` }}
      />


      {orbs.map((o) => (
        <motion.div
          key={`orb-${o.id}`}
          className="absolute rounded-full blur-2xl"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: o.size,
            height: o.size,
            backgroundColor: o.isGold ? 'rgba(218,165,32,0.06)' : `${glow}0F`,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [-24, 24, -24],
                  y: [-32, 32, -32],
                  opacity: [0.5, 0.85, 0.5],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: o.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: o.delay
                }
          }
        />
      ))}

      {!reduceMotion &&
        lightBeams.map((beam) => (
          <motion.div
            key={`beam-${beam.id}`}
            aria-hidden="true"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{
              duration: 9,
              repeat: Infinity,
              delay: beam.delay,
              ease: 'easeInOut'
            }}
            style={{ rotate: beam.rotation }}
          >
            <div className="mx-auto h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </motion.div>
        ))}

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          aria-hidden="true"
          className={`absolute rounded-full ${particle.isGold ? 'bg-accent-light' : 'bg-white'}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: reduceMotion ? 0.4 : 0.55
          }}
          animate={reduceMotion ? undefined : floatingParticle(particle.delay, particle.duration)}
        />
      ))}

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px'
        }}
      />

      {/*
        Cinematic vignette. `bg-gradient-radial` is not a real Tailwind v4
        utility (it compiles to nothing), so this is written as an inline
        radial-gradient to guarantee the depth actually renders.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 45%, transparent 35%, rgba(2,10,20,0.55) 78%, rgba(2,10,20,0.9) 100%)'
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020A14]/85 to-transparent" />
    </div>
  );
}
