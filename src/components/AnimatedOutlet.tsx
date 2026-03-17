import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AnimatedOutlet
 * 
 * SPEED OF LIGHT transition — fast slide + fade inspired by Instagram.
 * Uses mode="wait" to prevent layout shifts ("shaking") during navigation.
 * Uses <Outlet /> (not useOutlet) to prevent stale route references.
 */
export function AnimatedOutlet() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 10, scale: 0.995 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    transition: {
                        duration: 0.2, // Ultra-fast (Velocity)
                        ease: [0.23, 1, 0.32, 1],
                        opacity: { duration: 0.15 }
                    }
                }}
                exit={{
                    opacity: 0,
                    x: -10,
                    scale: 1,
                    transition: {
                        duration: 0.15,
                        ease: [0.4, 0, 1, 1],
                    }
                }}
                exit={{ opacity: 1 }}
                className="h-full w-full flex flex-col flex-1"
                style={{ 
                    willChange: 'opacity, transform',
                    position: 'relative',
                    backfaceVisibility: 'hidden'
                }}
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
    );
}
