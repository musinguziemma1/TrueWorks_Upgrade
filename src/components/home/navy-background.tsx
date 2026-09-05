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
 * - Slow rotating light beams (wider + brighter)
 * - Continuously drifting particles (bigger + glow)
 * - Slow floating orbs (large soft circles on long paths)
 * - Growing + fading rings
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
  const particleCount = variant === "dense" ? 28 : intensity === "rich" ? 22 : 16;
  const beamCount = intensity === "rich" ? 4 : 3;
  const orbCount = intensity === "rich" ? 6 : intensity === "subtle" ? 3 : 4;
  const ringCount = intensity === "rich" ? 3 : 2;

  // Stable seeded values so animation doesn't re-randomize and
  // particles don't visibly jump between renders.
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    size: 3 + ((i * 7) % 6), // 3..8px (was 1.5..4.5)
    delay: (i * 0.4) % 5,
    duration: 14 + ((i * 3) % 10),
    isGold: i % 5 === 0,
  }));

  const beams = Array.from({ length: beamCount }, (_, i) => ({
    id: i,
    rotation: i * (180 / beamCount),
    delay: i * 1.5,
  }));

  // Large soft orbs that drift on long, slow paths
  const orbs = Array.from({ length: orbCount }, (_, i) => ({
    id: i,
    x: (i * 23 + 11) % 100,
    y: (i * 31 + 17) % 100,
    size: 60 + ((i * 13) % 80), // 60..140px
    duration: 24 + ((i * 5) % 12),
    delay: i * 1.7,
    isGold: i % 2 === 0,
  }));

  // Rings that grow and fade like sonar pings
  const rings = Array.from({ length: ringCount }, (_, i) => ({
    id: i,
    x: 15 + i * 35,
    y: 25 + ((i * 19) % 50),
    delay: i * 3,
    duration: 9 + i * 2,
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

      {/* Accent halos (bigger + more) */}
      <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent/[0.10] blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full bg-blue-500/[0.10] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.05] blur-3xl" />

      {/* Floating orbs (large soft circles) */}
      {orbs.map((o) => (
        <motion.div
          key={`orb-${o.id}`}
          className={cn(
            "absolute rounded-full blur-2xl",
            o.isGold ? "bg-accent/[0.10]" : "bg-blue-400/[0.10]",
          )}
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: o.size,
            height: o.size,
          }}
          animate={{
            x: [-30, 30, -30],
            y: [-40, 40, -40],
            opacity: [0.5, 0.9, 0.5],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: o.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: o.delay,
          }}
        />
      ))}

      {/* Light beams (wider + brighter) */}
      {beams.map((beam) => (
        <motion.div
          key={`beam-${beam.id}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.18, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: beam.delay,
            ease: "easeInOut",
          }}
          style={{ rotate: beam.rotation }}
        >
          <div className="mx-auto h-full w-[3px] bg-gradient-to-b from-transparent via-white/25 to-transparent" />
        </motion.div>
      ))}

      {/* Drifting particles (bigger + glowing) */}
      {particles.map((p) => (
        <motion.div
          key={`p-${p.id}`}
          className={cn(
            "absolute rounded-full",
            p.isGold ? "bg-accent-light" : "bg-white",
          )}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: p.isGold
              ? `0 0 ${p.size * 2}px ${p.size}px rgba(218,165,32,0.35)`
              : `0 0 ${p.size * 2}px ${p.size}px rgba(255,255,255,0.25)`,
            opacity: 0.7,
          }}
          animate={{
            y: [-28, 28, -28],
            x: [-14, 14, -14],
            opacity: [0.3, 0.85, 0.3],
            scale: [0.85, 1.25, 0.85],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Sonar rings (large outlines that grow + fade) */}
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
            marginTop: -40,
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 2.4], opacity: [0, 0.45, 0] }}
          transition={{
            duration: r.duration,
            repeat: Infinity,
            ease: "easeOut",
            delay: r.delay,
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
