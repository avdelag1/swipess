import { logger } from '@/utils/prodLogger';
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

/**
 * View Transitions API integration for instant page transitions.
 * Provides 0ms, browser-native cross-document transitions.
 * Falls back gracefully if API is not supported.
 */
export function useViewTransitions() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();

  const isSupported = typeof document !== 'undefined' && 'startViewTransition' in document;

  // Capture the current scroll position before transition
  const captureScroll = useCallback(() => {
    if (!isSupported) return;
    sessionStorage.setItem('scroll-position', JSON.stringify({
      x: window.scrollX,
      y: window.scrollY,
    }));
  }, [isSupported]);

  // Restore scroll position after transition
  const restoreScroll = useCallback(() => {
    if (!isSupported) return;
    const saved = sessionStorage.getItem('scroll-position');
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        window.scrollTo(x, y);
      } catch (_error) {
        logger.warn('malformed cached scroll payload', _error);
      }
      sessionStorage.removeItem('scroll-position');
    }
  }, [isSupported]);

  // Enhanced navigate that wraps in View Transition
  const navigateWithTransition = useCallback((to: string, options?: { replace?: boolean; state?: any }) => {
    if (!isSupported) {
      navigate(to, options);
      return;
    }

    captureScroll();

    document.startViewTransition(() => {
      navigate(to, options);
    }).finished.then(() => {
      restoreScroll();
    }).catch(() => {
      restoreScroll();
    });
  }, [navigate, isSupported, captureScroll, restoreScroll]);

  // Auto-handle browser back/forward with View Transitions
  useEffect(() => {
    if (!isSupported) return;

    const handlePopState = (_event: PopStateEvent) => {
      captureScroll();
      const transition = document.startViewTransition(() => {
        // The browser handles the actual navigation
      });
      transition.finished.then(restoreScroll).catch(restoreScroll);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSupported, captureScroll, restoreScroll]);

  return {
    navigate: navigateWithTransition,
    isSupported,
    location,
    navigationType,
  };
}

/**
 * View Transition name generator for shared element transitions
 * Use consistent names across pages for smooth morphing
 */
export function getViewTransitionName(route: string, elementType: 'card' | 'header' | 'nav' | 'footer' | 'content'): string {
  const routeKey = route.replace(/\//g, '-').replace(/^[-]+|[-]+$/g, '') || 'root';
  return `swipess-${elementType}-${routeKey}`;
}

/**
 * CSS View Transition classes for styling
 * Apply these to elements that should animate together across routes
 */
export const VIEW_TRANSITION_CLASSES = {
  // Page-level containers
  pageWrapper: 'view-transition-page',
  pageContent: 'view-transition-content',
  
  // Shared elements (header, nav, etc.)
  header: 'view-transition-header',
  bottomNav: 'view-transition-bottom-nav',
  floatingPlayer: 'view-transition-floating-player',
  
  // Card/list items
  swipeCard: 'view-transition-swipe-card',
  listingCard: 'view-transition-listing-card',
  
  // Modal/overlay
  modal: 'view-transition-modal',
  dialog: 'view-transition-dialog',
} as const;