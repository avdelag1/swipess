import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * TINDER-SPEED PAGE WRAPPER
 *
 * For standalone pages (public/legal/info). Matches the ultra-fast
 * opacity-only transitions used in AnimatedOutlet.
 */

const pageVariants = {
  initial: { opacity: 0, scale: 0.99 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1], // Zenith Glide
    }
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: {
      duration: 0.15,
      ease: [0.32, 0, 0.67, 0],
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
