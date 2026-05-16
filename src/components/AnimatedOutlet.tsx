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

  return (
    <div
      className={`min-h-full w-full flex flex-col flex-1 ${isDashboardRoute ? 'bg-transparent' : 'bg-background'}`}
      style={{ position: 'relative', pointerEvents: isDashboardRoute ? 'none' : 'auto' }}
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
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.10, ease: [0.22, 1, 0.36, 1] }}
          className={`flex-1 w-full flex flex-col ${isDashboardRoute ? 'bg-transparent' : 'bg-background'}`}
          // Dashboard routes: no scrolling — the persistent swipe deck underneath
          //   handles all touch events.
          // Other routes: overflow-y: auto makes this the scroll container so
          //   every page scrolls within this bounded box regardless of content
          //   height, without relying on the outer <main> scroll container.
          style={
            isDashboardRoute
              ? { position: 'absolute', inset: 0, pointerEvents: 'none' }
              : {
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'auto',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehaviorY: 'contain',
                }
          }
        >
          <Suspense fallback={null}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
