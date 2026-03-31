import { useNavigate } from 'react-router-dom';
import { useTransition } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { prefetchRoute } from '@/utils/routePrefetcher';

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
  const [isPending, startTransition] = useTransition();

  const prefetch = (to: string) => {
    // 🚀 SPEED OF LIGHT: Integrated with Network-Aware Prefetcher
    if (to && typeof to === 'string' && to.startsWith('/')) {
      prefetchRoute(to);
    }
  };

  const appNavigate = (to: string | number, options?: any) => {
    triggerHaptic('light');

    startTransition(() => {
      if (typeof to === 'number') {
        navigate(to);
      } else {
        navigate(to, options);
      }
    });
  };

  return { 
    navigate: appNavigate, 
    prefetch,
    isPending,
    rawNavigate: navigate 
  };
}
