'use client';

import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Globe, TrendingUp, Check } from 'lucide-react';
import HeroIllustration from './HeroIllustration';
import HeroButtons from './HeroButtons';
import { textFadeIn, textSlideUp, staggerChildren } from './animations';

const trustBadges = [
  { icon: ShieldCheck, label: 'Built for serious organizations' },
  { icon: Globe, label: 'Trusted across 30+ countries' },
  { icon: TrendingUp, label: 'Real-time performance data' },
];

export default function Hero() {
  return (
    <div className="relative w-full min-h-[100svh] overflow-hidden bg-[#04101F]">
      {/* Background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#04101F] via-[#071A33] to-[#04101F]" />
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#DAA520] opacity-[0.05] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-500 opacity-[0.04] blur-3xl" />
        <div className="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-purple-500 opacity-[0.03] blur-3xl" />

        {/* Light beams */}
        {[15, 165, 285].map((rot, i) => (
          <motion.div
            key={rot}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0] }}
            transition={{ duration: 9, repeat: Infinity, delay: i * 1.5, ease: 'easeInOut' }}
            style={{ rotate: rot }}
          >
            <div className="mx-auto h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </motion.div>
        ))}

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '400px 400px',
          }}
        />
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#04101F]/80" />
      </div>

      {/* Content grid */}
      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-8 px-6 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
        {/* Left: copy */}
        <motion.div
          className="flex flex-col justify-center"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          <div className="mx-auto w-full max-w-xl">
            <motion.div className="mb-6 flex flex-wrap items-center gap-3" variants={textFadeIn}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light backdrop-blur">
                <Sparkles className="h-3 w-3" />
                Business Operating Systems
              </span>
            </motion.div>

            <motion.h1
              className="font-heading text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl xl:text-[64px]"
              variants={textSlideUp}
            >
              Smarter systems.
              <br />
              <span className="text-gradient-gold">Stronger organizations.</span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
              variants={textFadeIn}
            >
              TrueWorks builds premium templates, dashboards and operating
              systems that help hospitals, NGOs, churches, schools and growing
              businesses run on clarity — not chaos.
            </motion.p>

            <motion.div className="mt-9" variants={textFadeIn}>
              <HeroButtons
                onExploreClick={() => {
                  window.location.href = '/store';
                }}
                onDemoClick={() => {
                  const demo = document.getElementById('demo');
                  if (demo) demo.scrollIntoView({ behavior: 'smooth' });
                  else window.location.href = '/about';
                }}
              />
            </motion.div>

            <motion.ul
              className="mt-10 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2"
              variants={staggerChildren}
            >
              {trustBadges.map((b) => (
                <motion.li
                  key={b.label}
                  variants={textFadeIn}
                  className="inline-flex items-center gap-2 text-sm text-white/70"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent-light">
                    <Check className="h-3 w-3" />
                  </span>
                  {b.label}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </motion.div>

        {/* Right: illustration */}
        <div className="relative flex items-center justify-center">
          <HeroIllustration className="w-full" />
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="flex flex-col items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50"
        >
          <span>Scroll to explore</span>
          <motion.span
            className="h-6 w-px bg-gradient-to-b from-white/60 to-transparent"
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: 'top' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
