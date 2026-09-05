"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavyBackgroundProps {
  className?: string;
  intensity?: "subtle" | "normal" | "rich";
  variant?: "default" | "dense";
}

/**
 * Shared navy-band background with:
 * - Solid navy fill
 * - Two blurred accent halos
 * - Slow rotating light beams
 * - Continuously drifting particles
 * - Subtle noise overlay
 * - Radial vignette
 *
 * Use inside any section that needs a hero-grade dark band
 * (StatsBand, ShopByIndustry, WhyTrueWorks, FreeResource, FinalCTA).
 */
export default function NavyBackground({
  className,
  intensity = "normal",
  variant = "default",
}: NavyBackgroundProps) {
  const particleCount = variant === "dense" ? 24 : intensity === "rich" ? 20 : 14;
  const beamCount = intensity === "rich" ? 4 : 3;

  // Use stable seeded values so the animation doesn't re-randomize
  // on every render and the particles don't visibly jump.
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    size: ((i * 7) % 3) + 1.5,
    delay: (i * 0.4) % 5,
    duration: 14 + ((i * 3) % 10),
  }));

  const beams = Array.from({ length: beamCount }, (_, i) => ({
    id: i,
    rotation: i * (180 / beamCount),
    delay: i * 1.5,
  }));

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className,
      )}
      aria-hidden
    >
      {/* Solid navy fill */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#071A33] via-[#071A33] to-[#071A33]" />

      {/* Accent halos */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-accent/[0.08] blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-500/[0.06] blur-3xl" />

      {/* Light beams (slow pulse) */}
      {beams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: beam.delay,
            ease: "easeInOut",
          }}
          style={{ rotate: beam.rotation }}
        >
          <div className="mx-auto h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </motion.div>
      ))}

      {/* Drifting particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-12, 12, -12],
            x: [-6, 6, -6],
            opacity: [0.2, 0.5, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "400px 400px",
        }}
      />

      {/* Radial vignette for depth */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#04101F]/80" />
    </div>
  );
}
