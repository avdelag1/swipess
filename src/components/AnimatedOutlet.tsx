import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PREMIUM PAGE TRANSITIONS
 * 
 * Spring physics for buttery-smooth, game-like feel:
 * - Faster, snappier transitions (no sluggish ease curves)
 * - Subtle slide + fade for depth
 * - Optimized will-change for 60fps performance
 */

// Premium spring config - smooth fade for clean page transitions
const pageTransition = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { 
      duration: 0.15
    }
  },
  exit: { 
    opacity: 0, 
    transition: { 
      duration: 0.1
    }
  },
  // Performance optimizations
  style: { 
    willChange: 'opacity',
    backfaceVisibility: 'hidden' as const
  }
};

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={location.pathname}
                {...pageTransition}
                className="h-full w-full flex flex-col flex-1"
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
