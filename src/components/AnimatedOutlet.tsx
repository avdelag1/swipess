import { useLocation, useOutlet } from 'react-router-dom';
import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  const isDashboardRoute =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard' ||
    location.pathname.startsWith('/client/dashboard/') ||
    location.pathname.startsWith('/owner/dashboard/');

  if (isDashboardRoute) {
    return (
      <div
        className="min-h-full w-full flex flex-col flex-1 bg-transparent"
        style={{ position: 'relative', pointerEvents: 'none' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, mass: 0.4 }}
            className="flex-1 w-full flex flex-col bg-transparent pointer-events-none-force"
            style={{ position: 'absolute', inset: 0 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
              </div>
            }>
              {outlet}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        id="page-scroll-container"
        className="swipess-page-wrapper w-full min-h-full block"
        style={{ position: 'relative', pointerEvents: 'auto' }}
        initial={{ opacity: 0.6, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.5 }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        }>
          {outlet}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
