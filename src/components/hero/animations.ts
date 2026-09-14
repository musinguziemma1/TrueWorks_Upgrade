import { Variants } from 'framer-motion';
import type { SlideData } from './data';

export const heroThemes: SlideData['theme'][] = [
  'healthcare',
  'nonprofit',
  'education',
  'business',
  'faith',
];

// Per-slide cinematic grade: deep base -> theme glow -> vignette.
// All themes are rendered stacked and crossfaded so the mood shifts
// smoothly instead of snapping (CSS cannot animate background-image).
export const themeGrade: Record<SlideData['theme'], string> = {
  healthcare: 'from-[#041824] via-[#06283A] to-[#04101F]',
  nonprofit: 'from-[#06182E] via-[#0A2A4A] to-[#04101F]',
  education: 'from-[#1A1405] via-[#2A2110] to-[#04101F]',
  business: 'from-[#120D2B] via-[#1C1440] to-[#04101F]',
  faith: 'from-[#2A0F1E] via-[#3F1526] to-[#04101F]',
};

export const themeGlowHex: Record<SlideData['theme'], string> = {
  healthcare: '#10B981',
  nonprofit: '#38BDF8',
  education: '#DAA520',
  business: '#A78BFA',
  faith: '#FB7185',
};

export const easeInOutQuart: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeInOutExpo: [number, number, number, number] = [0.87, 0, 0.13, 1];

// Text animations
export const textSlideUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 32,
    filter: 'blur(4px)'
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { 
      duration: 0.8, 
      ease: easeOutExpo,
      delay: 0.2
    }
  }
};

export const textFadeIn: Variants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: easeInOutQuart,
      delay: 0.4
    }
  }
};

// Button animations
export const buttonHover: Variants = {
  rest: { 
    scale: 1,
    boxShadow: '0 10px 40px rgba(227, 188, 63, 0.15)'
  },
  hover: { 
    scale: 1.02,
    boxShadow: '0 20px 60px rgba(227, 188, 63, 0.25)',
    transition: { 
      duration: 0.3, 
      ease: easeInOutQuart
    }
  },
  tap: { 
    scale: 0.98,
    transition: { 
      duration: 0.1
    }
  }
};

export const outlineButtonHover: Variants = {
  rest: { 
    scale: 1,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  hover: { 
    scale: 1.02,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(227, 188, 63, 0.5)',
    transition: { 
      duration: 0.3, 
      ease: easeInOutQuart
    }
  },
  tap: { 
    scale: 0.98,
    transition: { 
      duration: 0.1
    }
  }
};

// Feature icon animations
export const featureIconHover: Variants = {
  rest: { 
    scale: 1,
    rotate: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  hover: { 
    scale: 1.1,
    rotate: 5,
    backgroundColor: 'rgba(227, 188, 63, 0.1)',
    transition: { 
      duration: 0.4, 
      ease: easeInOutQuart
    }
  }
};

// Slide animations — quick crossfade with a gentle rise (no zoom loop,
// so the product frame feels stable and premium).
export const slideTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: easeInOutExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: {
      duration: 0.5,
      ease: easeInOutQuart,
    },
  },
};

// Gentle settle for the product frame (replaces the aggressive Ken Burns zoom)
export const kenBurnsEffect: Variants = {
  initial: {
    scale: 1.02,
    y: 12,
  },
  animate: {
    scale: 1,
    y: 0,
    transition: {
      duration: 1.1,
      ease: easeOutExpo,
    },
  },
};

// Floating KPI cards
export const floatingCard: Variants = {
  initial: { 
    y: 0,
    rotate: 0
  },
  animate: { 
    y: [-8, 8, -8],
    rotate: [-1, 1, -1],
    transition: { 
      duration: 6, 
      repeat: Infinity, 
      ease: 'easeInOut'
    }
  }
};

// Staggered children animation
export const staggerChildren: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

// Particle animations
export const floatingParticle = (delay: number, duration: number) => ({
  y: [-28, 28, -28],
  x: [-14, 14, -14],
  opacity: [0.3, 0.85, 0.3],
  scale: [0.85, 1.25, 0.85],
  transition: {
    duration,
    repeat: Infinity,
    ease: 'easeInOut' as const,
    delay
  }
});

// Progress bar animation — duration is driven by the slider autoplay interval.
export const progressFill = (duration = 8): Variants => ({
  hidden: {
    width: '0%'
  },
  visible: {
    width: '100%',
    transition: {
      duration,
      ease: 'linear'
    }
  }
});

// Dashboard module animations
export const moduleSlideIn = (index: number): Variants => ({
  hidden: { 
    opacity: 0, 
    x: -20,
    y: 10
  },
  visible: { 
    opacity: 1, 
    x: 0,
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: easeOutExpo,
      delay: 0.8 + (index * 0.1)
    }
  }
});

// Counter animation for KPIs
export const counterAnimation = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.3,
      ease: easeInOutQuart
    }
  }
};

// Glow effect for interactive elements
export const glowEffect: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(227, 188, 63, 0)'
  },
  hover: {
    boxShadow: '0 0 30px rgba(227, 188, 63, 0.3)',
    transition: {
      duration: 0.3,
      ease: easeInOutQuart
    }
  }
};