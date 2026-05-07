import { useNavigate } from 'react-router-dom';
import { useTransition } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { prefetchRoute } from '@/utils/routePrefetcher';

function setNavDirection(direction: 'forward' | 'back') {
  document.documentElement.setAttribute('data-navigation-direction', direction);
}

function clearNavDirection() {
  document.documentElement.removeAttribute('data-navigation-direction');
}

/**
 * ⚡ INSTANT NAVIGATION HOOK
 *
 * 1. Predictive Prefetching — preloads page chunks on pointer-down intent
 * 2. Transition-Aware — uses React startTransition for zero-blocking UI
 * 3. Haptic Feedback — sub-millisecond haptics on every navigate
 * 4. Direction Tracking — sets data-navigation-direction on <html> so the
 *    View Transitions CSS uses the correct iOS-style slide animation
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const [isPending, _startTransition] = useTransition();

  const prefetch = (to: string) => {
    if (to && typeof to === 'string' && to.startsWith('/')) {
      prefetchRoute(to);
    }
  };

  const appNavigate = (to: string | number, options?: any) => {
    try { triggerHaptic('light'); } catch {}

    // Detect direction: numeric negative = back, everything else = forward
    const direction = typeof to === 'number' && to < 0 ? 'back' : 'forward';
    setNavDirection(direction);

    const performNavigation = () => {
      _startTransition(() => {
        if (typeof to === 'number') {
          navigate(to);
        } else {
          navigate(to, options);
        }
      });
    };

    try {
      if (typeof document !== 'undefined' && (document as any).startViewTransition) {
        const transition = (document as any).startViewTransition(() => {
          performNavigation();
        });
        if (transition?.finished) {
          transition.finished
            .then(clearNavDirection)
            .catch(clearNavDirection);
        }
      } else {
        performNavigation();
        // Clear direction after animation completes
        setTimeout(clearNavDirection, 400);
      }
    } catch {
      performNavigation();
      setTimeout(clearNavDirection, 400);
    }
  };

  return {
    navigate: appNavigate,
    prefetch,
    isPending,
    rawNavigate: navigate,
  };
}
