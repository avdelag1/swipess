import { useNavigate } from 'react-router-dom';
import { useTransition } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { isRoutePrefetched, prefetchRoute } from '@/utils/routePrefetcher';

/**
 * ⚡ INSTANT NAVIGATION HOOK
 * 
 * Features:
 * 1. Predictive Prefetching: Preloads page chunks on intent (PointerDown)
 * 2. Transition-Aware: Uses React startTransition for zero-blocking UI
 * 3. Haptic Feedback: Integrated sub-millisecond haptics
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const [isPending, _startTransition] = useTransition();

  const prefetch = (to: string) => {
    // 🚀 SPEED OF LIGHT: Integrated with Network-Aware Prefetcher
    if (to && typeof to === 'string' && to.startsWith('/')) {
      prefetchRoute(to);
    }
  };

  const appNavigate = (to: string | number, options?: any) => {
    try { triggerHaptic('light'); } catch { /* empty */ }

    const performNavigation = () => {
      _startTransition(() => {
        if (typeof to === 'number') {
          navigate(to);
        } else {
          navigate(to, options);
        }
      });
    };

    const useInstantNav = typeof to === 'string'
      && (isRoutePrefetched(to) || to.endsWith('/dashboard') || to === '/messages' || to === '/notifications');

    // Skip view transitions for prefetched / tab routes — feels instant
    try {
      if (!useInstantNav && typeof document !== 'undefined' && (document as any).startViewTransition) {
        const transition = (document as any).startViewTransition(() => {
          performNavigation();
        });
        if (transition?.finished?.catch) transition.finished.catch(() => {});
      } else {
        performNavigation();
      }
    } catch {
      performNavigation();
    }
  };

  return { 
    navigate: appNavigate, 
    prefetch,
    isPending,
    rawNavigate: navigate 
  };
}


