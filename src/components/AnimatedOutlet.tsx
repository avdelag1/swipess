import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TINDER-SPEED PAGE TRANSITIONS
 *
 * Key changes for native-app feel:
 * - Crossfade (no "wait" mode) — new page fades in WHILE old fades out
 * - Opacity-only for speed — no scale/translate which cause layout recalc
 * - Ultra-short durations — 120ms enter, 80ms exit
 * - GPU-only properties (opacity is composited, zero layout cost)
 */

const pageTransition = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.12,
      ease: [0.25, 0.1, 0.25, 1], // CSS ease equivalent — fast start, smooth end
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

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={location.pathname}
                {...pageTransition}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity' }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
