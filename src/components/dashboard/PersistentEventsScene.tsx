import { lazy, Suspense, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Keep Events feed mounted (like the dashboard) so swipe index, decoded
 * media, and RQ warm state survive tab switches.
 */
const EventosFeed = lazy(() => import('@/pages/EventosFeed'));

function isEventsFeedRoute(pathname: string): boolean {
  return pathname === '/explore/events' || pathname === '/explore/events/';
}

export function PersistentEventsScene() {
  const location = useLocation();
  const isFeed = isEventsFeedRoute(location.pathname);
  // Always keep the feed mounted after first visit so media/state survive
  // tab switches — and mount immediately when landing on /explore/events.
  const mountedRef = useRef(isFeed);
  if (isFeed) mountedRef.current = true;

  useEffect(() => {
    /* keep location subscription alive */
  }, [location.pathname]);

  if (!mountedRef.current) return null;

  return (
    <div
      aria-hidden={!isFeed}
      data-events-scene={isFeed ? 'active' : 'idle'}
      className="absolute inset-0 flex flex-col"
      style={{
        // Sit above the empty outlet shell when active so the feed is never covered.
        zIndex: isFeed ? 20 : 1,
        display: isFeed ? 'flex' : 'none',
        pointerEvents: isFeed ? 'auto' : 'none',
        background: isFeed ? '#0a0a0b' : 'transparent',
      }}
    >
      <Suspense fallback={null}>
        <EventosFeed />
      </Suspense>
    </div>
  );
}

export default PersistentEventsScene;
