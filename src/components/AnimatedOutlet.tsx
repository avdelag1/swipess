import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AnimatedOutlet
 * 
 * Lightweight route transition — opacity + subtle translate only.
 * NO blur, NO rotateY, NO 3D transforms — these cause massive frame drops
 * on mobile/PWA during every single navigation.
 */
export function AnimatedOutlet() {
    const location = useLocation();
    const element = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            {element ? (
                <motion.div
                    key={location.key}
                    initial={{ opacity: 0, x: 12, scale: 0.98 }}
                    animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        transition: {
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                            mass: 0.6,
                        }
                    }}
                    exit={{
                        opacity: 0,
                        x: -8,
                        scale: 0.99,
                        transition: {
                            duration: 0.15,
                            ease: [0.4, 0, 1, 1]
                        }
                    }}
                    className="h-full w-full flex flex-col flex-1"
                    style={{
                        willChange: 'transform, opacity',
                        transform: 'translateZ(0)',
                    }}
                >
                    {element}
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}