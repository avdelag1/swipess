import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  return (
    <div
      className="min-h-full w-full flex flex-col flex-1 bg-background"
      style={{ position: 'relative' }}
    >
      {/* No mode="wait" — that holds the old screen on-screen for the full exit
          duration before painting the new one, which makes navigation feel
          laggy. Default cross-fade lets the new page paint immediately while
          the old one fades out. Filter/scale removed to keep it cheap. */}
      {/* No exit animation — exit holds the previous frame on screen and
          forces the entering route to wait, which is exactly what causes
          the "splash flash" between pages on slow chunk loads.
          We render a single keyed motion.div that fades opacity in only
          (no exit), and use a transparent Suspense fallback so the
          persistent layout (TopBar/BottomNav/Dashboard scene) stays
          fully painted while the next chunk arrives. */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0.001 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 w-full flex flex-col bg-transparent"
          style={{ position: 'absolute', inset: 0 }}
        >
          <Suspense fallback={null}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
