import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ANIMATED OUTLET — Instant exit + graceful fade-in entrance.
 *
 * The exiting page vanishes immediately (0ms) so there is never a blank gap
 * between pages. The entering page fades in smoothly (240ms ease-out).
 * No x/y translation — pure opacity only — prevents GPU compositing jank on mobile.
 */

// Spring config — organic, snappy, no overshirt
const ENTER_SPRING = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 26,
  mass: 0.8,
};

const EXIT_FAST = {
  duration: 0.14,
  ease: [0.4, 0, 1, 1] as const,
};

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] } }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity' }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
