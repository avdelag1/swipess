import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeNavConfig {
  /** Ordered list of paths the user can swipe between */
  paths: string[];
  /** Minimum horizontal distance in px (default 80) */
  threshold?: number;
  /** Minimum velocity in px/s (default 600) */
  velocityThreshold?: number;
  /** CSS selector for the scrollable container to attach listeners to */
  containerSelector?: string;
  enabled?: boolean;
}

/**
 * Enables horizontal swipe gestures to navigate between adjacent bottom-nav pages.
 *
 * Constraints:
 *  - Horizontal distance must exceed vertical distance (prevents scroll hijack)
 *  - Elements with `data-no-swipe-nav` attribute (or children thereof) are excluded
 *  - Respects both distance and velocity thresholds
 */
export function useSwipeNavigation({
  paths,
  threshold = 80,
  velocityThreshold = 600,
  containerSelector = '#dashboard-scroll-container',
  enabled = true,
}: SwipeNavConfig) {
  const navigate = useNavigate();
  const location = useLocation();
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const navigatedRef = useRef(false);

  const currentIndex = paths.indexOf(location.pathname);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Skip if touching an element that opts out of swipe nav
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe-nav]')) return;

    navigatedRef.current = false;
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchRef.current || navigatedRef.current) return;
      if (currentIndex === -1) return; // current page not in nav list

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchRef.current.x;
      const dy = touch.clientY - touchRef.current.y;
      const dt = (Date.now() - touchRef.current.t) / 1000; // seconds

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Must be more horizontal than vertical
      if (absDy >= absDx) return;

      const velocity = absDx / dt;
      const passesThreshold = absDx >= threshold || velocity >= velocityThreshold;
      if (!passesThreshold) return;

      // Determine direction: swipe left → next, swipe right → prev
      let nextIndex: number;
      if (dx < 0) {
        // Swipe left → go to next page
        nextIndex = currentIndex + 1;
      } else {
        // Swipe right → go to previous page
        nextIndex = currentIndex - 1;
      }

      if (nextIndex < 0 || nextIndex >= paths.length) return;

      navigatedRef.current = true;
      navigate(paths[nextIndex]);

      touchRef.current = null;
    },
    [currentIndex, paths, threshold, velocityThreshold, navigate],
  );

  useEffect(() => {
    if (!enabled) return;

    const container = document.querySelector(containerSelector) || document;
    container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    container.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [enabled, containerSelector, handleTouchStart, handleTouchEnd]);
}
