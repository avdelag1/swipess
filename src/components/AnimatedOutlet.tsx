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
  duration: 0.18,
  ease: [0.32, 0, 0.67, 0], // Organic cinematic ease-in
};

const ENTER_GLIDE = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1], // Power cubic-bezier (Zenith Standard)
};

const pageVariants: any = {
  initial: {
    opacity: 0,
    x: 8,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 450,
      damping: 38,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.005,
    x: -4,
    transition: {
      duration: 0.15,
      ease: 'easeOut'
    },
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
