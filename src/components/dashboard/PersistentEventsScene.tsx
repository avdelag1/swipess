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
  const mountedRef = useRef(isFeed);
  if (isFeed) mountedRef.current = true;

  useEffect(() => {
    /* keep location subscription alive */
  }, [location.pathname]);

  if (!mountedRef.current) return null;

  return (
    <div
      aria-hidden={!isFeed}
      className="absolute inset-0 flex flex-col"
      style={{
        zIndex: 1,
        display: isFeed ? 'flex' : 'none',
        pointerEvents: isFeed ? 'auto' : 'none',
      }}
    >
      <Suspense fallback={null}>
        <EventosFeed />
      </Suspense>
    </div>
  );
}

export default PersistentEventsScene;
