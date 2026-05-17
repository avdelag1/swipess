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

  // Non-dashboard routes: render the outlet inline as a normal block so
  // its content participates in the outer scroll container's layout.
  // `flex-grow` lets this wrapper stretch beyond the viewport when its
  // content is tall, pushing #dashboard-scroll-container into scroll.
  // `min-h-full` guarantees short pages still fill the screen.
  // NO `flex-1` — that clamps to the parent's allocated height and clips.
  return (
    <div
      key={location.pathname}
      className="w-full flex-grow min-h-full bg-background"
      style={{ position: 'relative', pointerEvents: 'auto' }}
    >
      <Suspense fallback={null}>
        {outlet}
      </Suspense>
    </div>
  );
}
