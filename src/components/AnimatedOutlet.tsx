import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SuspenseFallback } from './ui/suspense-fallback';

// iOS-feel: fast, subtle upward drift — matches tab-bar navigation feel
const PAGE_DURATION = 0.14;
const PAGE_EASE = [0, 0, 0.2, 1] as const; // material ease-out

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  // Track history index to detect back navigation
  const prevIdxRef = useRef<number>(
    typeof window !== 'undefined' ? (window.history.state?.idx ?? 0) : 0
  );
  const currentIdx = typeof window !== 'undefined' ? (window.history.state?.idx ?? 0) : 0;
  const isBack = currentIdx < prevIdxRef.current;
  prevIdxRef.current = currentIdx;

  return (
    // overflow-hidden is critical — without it the exiting absolute page
    // bleeds outside the container and causes the "breaking window" effect.
    <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden relative">
      {/*
        mode="wait" exits the old page (0.14s) then enters the new one (0.14s).
        Total: ~0.28s — imperceptible but eliminates the two-page overlap that
        caused layout jank with cross-fading absolute elements.
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          custom={isBack}
          variants={{
            enter: (back: boolean) => ({
              opacity: 0,
              // Subtle directional shift — forward=up-slightly, back=down-slightly
              y: back ? 6 : -6,
            }),
            center: { opacity: 1, y: 0 },
            exit: (back: boolean) => ({
              opacity: 0,
              y: back ? -4 : 4,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: PAGE_DURATION, ease: PAGE_EASE }}
          className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden"
          style={{ WebkitOverflowScrolling: 'touch' as any }}
        >
          <Suspense fallback={<SuspenseFallback minimal />}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
