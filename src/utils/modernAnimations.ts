import { Variants } from 'framer-motion';

/**
 * Ultra-fast, imperceptible fade variants.
 * Designed to feel like native iOS page transitions — 
 * nearly instant so the user never notices a "loading" state.
 */
export const deckFadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.12,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
