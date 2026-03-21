import { useRef, useCallback } from 'react';

/**
 * Custom hook to provide guard logic for navigation events like double-taps.
 * It tracks an internal 'isNavigatingRef' state and ensures a minimum duration between calls.
 */
export function useNavigationGuard() {
  const isNavigatingRef = useRef(false);
  const lastNavigationRef = useRef(0);

  const canNavigate = useCallback(() => {
    const now = Date.now();
    // Prevent navigation if already in progress or if last one was very recent (300ms)
    if (isNavigatingRef.current || now - lastNavigationRef.current < 300) {
      return false;
    }
    return true;
  }, []);

  const startNavigation = useCallback(() => {
    isNavigatingRef.current = true;
    lastNavigationRef.current = Date.now();
  }, []);

  const endNavigation = useCallback(() => {
    isNavigatingRef.current = false;
  }, []);

  return { canNavigate, startNavigation, endNavigation };
}
