import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * View Transitions API Hook
 * Enables native browser transitions between page navigations
 * Fallbacks gracefully for unsupported browsers
 */
export function useViewTransitions() {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    // Check if browser supports View Transitions API
    if (!('startViewTransition' in document)) {
      return;
    }

    const prevLocation = prevLocationRef.current;
    const currentLocation = location.pathname;

    // Skip transition on initial mount
    if (prevLocation === currentLocation) {
      return;
    }

    // Set custom attributes for CSS targeting
    const isNavigatingBack = currentLocation.split('/').length < prevLocation.split('/').length;
    document.documentElement.setAttribute('data-navigation-direction', isNavigatingBack ? 'back' : 'forward');

    prevLocationRef.current = currentLocation;
  }, [location.pathname]);

  return null;
}

/**
 * Start a view transition programmatically
 * Useful for imperative transitions
 */
export function startViewTransition(callback: () => void | Promise<void>) {
  if (!('startViewTransition' in document)) {
    // Fallback for unsupported browsers
    Promise.resolve(callback());
    return;
  }

  // Use type assertion for startViewTransition
  (document as any).startViewTransition(callback);
}

/**
 * Check if View Transitions API is supported
 */
export function supportsViewTransitions(): boolean {
  return 'startViewTransition' in document;
}
