import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ANIMATED OUTLET — Flagship Transition Protocol
 *
 * Provides the signature "slide-up + fade" transition used across the app.
 * Every top-level navigation (Bottom Nav switches) triggers this transition.
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
        <AnimatePresence mode="wait" initial={true}>
            <motion.div
                key={location.key}
                initial={{ y: 24, opacity: 0 }}
                animate={{ 
                    y: 0, 
                    opacity: 1, 
                    transition: { 
                        duration: 0.3, 
                        ease: [0.25, 0.46, 0.45, 0.94]
                    } 
                }}
                exit={{ 
                    y: 16, 
                    opacity: 0, 
                    transition: { 
                        duration: 0.15, 
                        ease: [0.4, 0, 1, 1] 
                    } 
                }}
                className="h-full w-full flex flex-col flex-1"
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
