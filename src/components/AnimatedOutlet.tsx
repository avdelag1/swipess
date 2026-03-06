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
 * 
 * Now accepts props to pass to the routed components.
 */
export function AnimatedOutlet(props: any) {
    const location = useLocation();
    const element = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            {element ? (
                <motion.div
                    key={location.key}
                    initial={{
                        opacity: 0,
                        rotateY: 8,
                        scale: 0.94,
                        filter: 'blur(15px) saturate(150%)',
                        x: 20,
                        perspective: 1200
                    }}
                    animate={{
                        opacity: 1,
                        rotateY: 0,
                        scale: 1,
                        filter: 'blur(0px) saturate(100%)',
                        x: 0,
                        transition: {
                            type: "spring",
                            stiffness: 140,
                            damping: 22,
                            mass: 0.8,
                            duration: 0.6
                        }
                    }}
                    exit={{
                        opacity: 0,
                        rotateY: -8,
                        scale: 1.06,
                        filter: 'blur(15px) saturate(150%)',
                        x: -20,
                        transition: {
                            duration: 0.45,
                            ease: [0.33, 1, 0.68, 1]
                        }
                    }}
                    className="h-full w-full flex flex-col flex-1 origin-center perspective-1000"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {React.cloneElement(element, { ...props, key: location.key })}
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
