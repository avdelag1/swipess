import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ANIMATED OUTLET — Flagship Transition Protocol
 *
 * Provides the signature "spring-alive" transition between ALL app pages.
 * Includes the requested "Ambient Blue Transition" that flashes behind
 * pages as they change, unifying the Auth aesthetic across the whole app.
 *
 * Transition Design:
 *   - ENTER: Subtle upward spring with scale, on top of...
 *   - BACKGROUND: A deep blue/indigo ambient glow that surges and fades
 *   - EXIT: Fast opacity + y shift downward. Exits never linger.
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
  const prevDepthRef = useRef(location.pathname.split('/').length);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentDepth = location.pathname.split('/').length;
  const isForward = currentDepth >= prevDepthRef.current;
  prevDepthRef.current = currentDepth;

  // Trigger the background flash on route change
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Direction-aware Y offset: push in from bottom (forward) or top (backward)
  const enterY = isForward ? 18 : -12;
  const exitY = isForward ? -8 : 12;

  return (
    <div className="relative h-full w-full flex flex-col flex-1 overflow-hidden">
      {/* Global Ambient Blue Transition Background */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none z-[-1]"
            style={{
              background: 'radial-gradient(circle at 50% 120%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(circle at 50% -20%, rgba(139,92,246,0.12) 0%, transparent 60%)',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={true}>
        <motion.div
          key={location.pathname}
          initial={{
            y: enterY,
            opacity: 0,
            scale: 0.985,
          }}
        animate={{
          y: 0,
          opacity: 1,
          scale: 1,
          transition: ENTER_SPRING,
        }}
        exit={{
          y: exitY,
          opacity: 0,
          scale: 0.99,
          transition: EXIT_FAST,
        }}
        className="h-full w-full flex flex-col flex-1"
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {outlet}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
