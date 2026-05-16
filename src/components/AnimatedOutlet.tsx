import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  // On the persistent dashboard routes the outlet is empty by design
  // (the dashboard is rendered by PersistentDashboardScene below). We
  // make the outlet wrapper fully transparent so that layer shows
  // through; on every other route we keep `bg-background` so the page
  // fully covers the dashboard underneath.
  const isDashboardRoute =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard' ||
    location.pathname.startsWith('/client/dashboard/') ||
    location.pathname.startsWith('/owner/dashboard/');

  // Dashboard routes: use the original absolute overlay so the persistent
  // swipe deck below stays interactive. Use AnimatePresence for the
  // cross-fade between dashboard and the empty placeholder.
  if (isDashboardRoute) {
    return (
      <div
        className="min-h-full w-full flex flex-col flex-1 bg-transparent"
        style={{ position: 'relative', pointerEvents: 'none' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.10, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full flex flex-col bg-transparent"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <Suspense fallback={null}>
              {outlet}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Non-dashboard routes: AnimatedOutlet itself becomes the page's
  // scroll container. The outer `#dashboard-scroll-container` chain
  // has too many intermediate flex/min-height wrappers that quietly
  // collapse height in some browsers — making pages feel "stuck". By
  // pinning this wrapper to its parent (position: absolute; inset: 0)
  // and putting `overflow-y: auto` on it, the page always has a real
  // scrollbar, regardless of the chain above.
  return (
    <div
      key={location.pathname}
      id="page-scroll-container"
      className="bg-background"
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'contain',
        pointerEvents: 'auto',
      }}
    >
      <Suspense fallback={null}>
        {outlet}
      </Suspense>
    </div>
  );
}
