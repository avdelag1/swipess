/**
 * Premium Motion Configuration
 * Cinematic luxury feel with SaaS polish
 *
 * Design Philosophy:
 * - Calm + Confident motion
 * - No bouncing or overshooting
 * - Everything glides smoothly
 */

// Premium cubic-bezier easing (Apple-style smoothness)
export const premiumEasing = [0.4, 0, 0.2, 1] as const;

// Cinematic easing for dramatic moments
export const cinematicEasing = [0.25, 0.46, 0.45, 0.94] as const;

// Page transitions (respects existing fast iOS navigation)
export const pageTransition = {
  duration: 0.45,
  ease: premiumEasing,
};

// Micro-interactions (buttons, cards)
export const microInteraction = {
  duration: 0.2,
  ease: premiumEasing,
};

// Cinematic transitions for special moments
export const cinematicTransition = {
  duration: 0.6,
  ease: cinematicEasing,
};

// Background ambient animation
export const ambientMotion = {
  duration: 20,
  ease: "linear",
  repeat: Infinity,
};

// Hover effects
export const hoverScale = {
  subtle: 1.02,    // SaaS buttons
  medium: 1.03,    // Cards
  prominent: 1.05, // CTAs
};

// Tap/press effects
export const tapScale = 0.97;

// Animation levels (for user preferences)
export type AnimationLevel = "minimal" | "standard" | "premium" | "cinematic";

export const getTransitionDuration = (level: AnimationLevel): number => {
  switch (level) {
    case "minimal":
      return 0;
    case "standard":
      return 0.2;
    case "premium":
      return 0.45;
    case "cinematic":
      return 0.6;
    default:
      return 0.45;
  }
};

// Motion variants for common patterns
export const motionVariants = {
  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide up (premium page entrance)
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
  },

  // Scale (modals, dialogs)
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  // Float (cards, elevated elements)
  float: {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};
