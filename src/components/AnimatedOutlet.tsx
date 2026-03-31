import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * INSTANT PAGE TRANSITION — popLayout mode
 *
 * popLayout lets the NEW page mount immediately without waiting for exit.
 * Combined with high-stiffness spring physics and minimal offsets,
 * this gives Instagram/Tinder-level instant page switches.
 *
 * GPU-composited: opacity + transform only, zero layout cost.
 */

const EXIT_FAST = {
  duration: 0.08, // Instant exit
  ease: 'circIn',
};

const ENTER_GLIDE = {
  duration: 0.12, // Warp speed
  ease: [0.23, 1, 0.32, 1], // Fast cubic-bezier
};

const pageVariants: any = {
  initial: {
    opacity: 0,
    x: 12,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 800, // Ultra-high stiffness
      damping: 48,
      mass: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 1,
    x: -8,
    transition: EXIT_FAST,
  },
};

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full w-full flex flex-col flex-1 gpu-accelerate"
        style={{ willChange: 'transform, opacity' }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
