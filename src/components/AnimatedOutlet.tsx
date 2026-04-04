import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';
import { SuspenseFallback } from './ui/suspense-fallback';

/**
 * SPEED OF LIGHT NAVIGATION
 * 
 * native-inspired page transitions with:
 * 1. View Transitions API (if available) for 'Magic' feel
 * 2. popLayout mode to prevent layout shift
 * 3. Local Suspense to keep Headers/Nav alive while body loads
 */

const pageVariants: any = {
  initial: {
    opacity: 0,
    // ZERO Offset + ZERO Scale = No "Jumpy" feeling. 
    // Just a clean, premium cross-dissolve that feels instant.
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.1, // SPEED OF LIGHT: 100ms is the threshold for 'Instant'
      ease: [0.23, 1, 0.32, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.08, // Ultra-fast exit
      ease: 'circIn',
    },
  },
};

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const isFixedViewportRoute = location.pathname.startsWith('/radio');

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={isFixedViewportRoute
          ? "h-full w-full flex flex-col flex-1"
          : "h-full w-full flex flex-col flex-1 gpu-accelerate overflow-hidden"}
        style={isFixedViewportRoute
          ? { position: 'relative' }
          : {
              willChange: 'opacity',
              position: 'relative'
            }}
      >
        <Suspense fallback={<SuspenseFallback minimal />}>
          {outlet}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
