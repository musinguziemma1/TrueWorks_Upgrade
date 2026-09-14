import { Variants } from 'framer-motion';

// Smooth easing functions for premium feel
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

// Slide animations
export const slideTransition: Variants = {
  hidden: { 
    opacity: 0,
    scale: 1.1
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 1.2, 
      ease: easeInOutExpo
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    transition: { 
      duration: 0.8, 
      ease: easeInOutQuart
    }
  }
};

// Ken Burns effect for images
export const kenBurnsEffect: Variants = {
  initial: { 
    scale: 1 
  },
  animate: { 
    scale: 1.1,
    transition: { 
      duration: 20, 
      ease: 'linear'
    }
  }
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

// Progress bar animation
export const progressFill: Variants = {
  hidden: { 
    width: '0%' 
  },
  visible: { 
    width: '100%',
    transition: { 
      duration: 8, 
      ease: 'linear'
    }
  }
};

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