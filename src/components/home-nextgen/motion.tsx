"use client";

import Link from "next/link";
import { useCallback, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- *
 * Shared motion primitives for the next-generation homepage.
 *
 * Everything here respects `prefers-reduced-motion`: transform-heavy effects
 * collapse to opacity-only when the user asks for reduced motion. The page
 * wrapper additionally mounts <MotionConfig reducedMotion="user"> so layout and
 * transform animations are neutralised globally.
 * -------------------------------------------------------------------------- */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before the reveal starts. */
  delay?: number;
  /** Distance travelled in px (set 0 to fade only). */
  y?: number;
  duration?: number;
  once?: boolean;
}

/** Scroll-triggered fade/slide reveal. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.6,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: reduceMotion ? 0.01 : duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/** Reveal with a soft top-down mask, used for editorial imagery. */
export function MaskReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, clipPath: "inset(12% 0% 12% 0% round 18px)" }}
      whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 18px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduceMotion ? 0.01 : 0.9, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers direct <StaggerItem> children. */
export function StaggerGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 22,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- *
 * Magnetic CTAs
 * -------------------------------------------------------------------------- */

export interface MagneticOffset {
  x: ReturnType<typeof useSpring>;
  y: ReturnType<typeof useSpring>;
  onMouseMove: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  enabled: boolean;
}

/**
 * Subtle magnetic hover for primary CTAs: the element drifts a few pixels
 * toward the cursor, then springs back. Disabled for reduced motion.
 */
export function useMagneticOffset(strength = 6): MagneticOffset {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduceMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      x.set((relX / rect.width) * strength * 2);
      y.set((relY / rect.height) * strength * 2);
    },
    [reduceMotion, strength, x, y]
  );

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { x: springX, y: springY, onMouseMove, onMouseLeave, enabled: !reduceMotion };
}

export function MagneticLink({
  href,
  children,
  className,
  strength = 5,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const { x, y, onMouseMove, onMouseLeave, enabled } = useMagneticOffset(strength);

  return (
    <motion.span
      style={enabled ? { x, y } : undefined}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn("inline-flex", className)}
    >
      <Link href={href} className="inline-flex">
        {children}
      </Link>
    </motion.span>
  );
}

export function MagneticButton({
  children,
  className,
  strength = 5,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const { x, y, onMouseMove, onMouseLeave, enabled } = useMagneticOffset(strength);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={enabled ? { x, y } : undefined}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(className)}
    >
      {children}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- *
 * Scroll helpers
 * -------------------------------------------------------------------------- */

/** Thin brand progress bar pinned to the top of the homepage. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-accent-dark via-accent to-accent-light"
    />
  );
}

/**
 * Vertical parallax for decorative layers. Attach `ref` to the section and
 * spread `style` on the moving layer.
 */
export function useParallax(distance = 60) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const flat = useTransform(scrollYProgress, [0, 1], [0, 0]);

  return reduceMotion ? flat : y;
}