import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * TINDER-SPEED PAGE WRAPPER
 *
 * For standalone pages (public/legal/info). Matches the ultra-fast
 * opacity-only transitions used in AnimatedOutlet.
 */

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.1, // SPEED OF LIGHT: 100ms
      ease: [0.23, 1, 0.32, 1],
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.08,
      ease: 'circIn',
    }
  },
} as const;

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="h-full w-full gpu-accelerate"
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}
