import { useRef, useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PullToRefreshOptions {
  /** Element to attach to (defaults to window) */
  containerRef?: React.RefObject<HTMLElement>;
  /** Minimum pull distance to trigger refresh (px) */
  threshold?: number;
  /** Callback on refresh */
  onRefresh?: () => Promise<void>;
}

/**
 * 🚀 Native-feeling pull-to-refresh for mobile PWA
 * - Invalidates all React Query caches on pull
 * - Haptic feedback on trigger
 * - Smooth rubber-band physics
 */
export function usePullToRefresh({
  containerRef,
  threshold = 80,
  onRefresh,
}: PullToRefreshOptions = {}) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if ('vibrate' in navigator) navigator.vibrate(15);

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await queryClient.invalidateQueries();
      }
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [queryClient, onRefresh]);

  useEffect(() => {
    const el = containerRef?.current || document.documentElement;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        // Rubber-band resistance
        const distance = Math.min(dy * 0.4, threshold * 1.5);
        setPullDistance(distance);
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= threshold) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef, threshold, isRefreshing, pullDistance, handleRefresh]);

  return { isRefreshing, pullDistance, triggered: pullDistance >= threshold };
}


