import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';
import { SuspenseFallback } from './ui/suspense-fallback';

const pageVariants: any = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.06, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.04, ease: 'circIn' },
  },
};

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const isFixedViewportRoute = location.pathname.startsWith('/radio');

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={isFixedViewportRoute
          ? "h-full w-full flex flex-col flex-1"
          : "h-full w-full flex flex-col flex-1 gpu-accelerate overflow-hidden"}
        style={{ position: 'relative' }}
      >
        <Suspense fallback={<SuspenseFallback minimal />}>
          {outlet}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
