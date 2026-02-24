import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AnimatedOutlet
 * 
 * Replaces the standard React Router <Outlet /> to enable smooth
 * page transitions between routes.
 * 
 * Fixed: Uses React.cloneElement with location.key to freeze the React Router 
 * context during the exit animation, preventing unmount crashes.
 */
export function AnimatedOutlet() {
    const location = useLocation();
    const element = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            {element ? (
                <motion.div
                    key={location.key}
                    initial={{ opacity: 0, scale: 0.96, filter: 'blur(10px)', y: 10 }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)', y: -10 }}
                    transition={{
                        type: "spring",
                        stiffness: 120, // Slightly firmer for precision
                        damping: 24,    // Good control
                        mass: 0.8       // Lighter feel
                    }}
                    className="h-full w-full flex flex-col flex-1 origin-center"
                >
                    {React.cloneElement(element, { key: location.key })}
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
