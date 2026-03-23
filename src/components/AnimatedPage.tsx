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
      duration: 0.12,
      ease: [0.25, 0.1, 0.25, 1],
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.08,
      ease: [0.4, 0, 1, 1],
    }
  },
};

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      style={{ willChange: 'opacity' }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
