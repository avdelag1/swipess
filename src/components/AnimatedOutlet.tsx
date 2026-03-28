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

const ENTER_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

const EXIT_FAST = {
  duration: 0.12,
  ease: [0.4, 0, 1, 1] as [number, number, number, number],
};

const pageVariants = {
  initial: {
    opacity: 0,
    x: 6,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      ...ENTER_SPRING,
      opacity: { duration: 0.1, ease: 'easeOut' },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    transition: EXIT_FAST,
  },
} as const;

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
        className="h-full w-full flex flex-col flex-1 stagger-enter"
        style={{ willChange: 'transform, opacity' }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
