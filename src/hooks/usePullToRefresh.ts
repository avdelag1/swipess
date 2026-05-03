import { useRef, useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PullToRefreshOptions {
  /** Element to attach to (defaults to window) */
  containerRef?: React.RefObject<HTMLElement>;
  /** Whether to disable pull-to-refresh */
  disabled?: boolean;
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
  disabled = false,
}: PullToRefreshOptions = {}) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if ('vibrate' in navigator) navigator.vibrate(15);

    // 🚀 MINIMUM DURATION: Ensure the user sees the 'Nexus' loader doing its work.
    // If the API call is instant, it feels like it didn't work.
    const minWait = new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (onRefresh) {
        await Promise.all([onRefresh(), minWait]);
      } else {
        await Promise.all([
          queryClient.invalidateQueries({ refetchType: 'all' }),
          minWait
        ]);
      }
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [queryClient, onRefresh]);

  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      pulling.current = false;
      return;
    }

    const el = containerRef?.current || document.documentElement;

    const onTouchStart = (e: TouchEvent) => {
      if (disabled) return;
      // Only start pull if we're at the very top of the scroll container
      if (el.scrollTop <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
        pulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || disabled) return;
      
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const dy = currentY - startY.current;
      const dx = Math.abs(currentX - startX.current);

      // 🛡️ SWIPE PROTECTION: If the user is swiping horizontally (like on a card),
      // or if they are scrolling up, cancel the pull immediately.
      if (dy < 0 || (dx > Math.abs(dy) && dy < 20)) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }

      if (dy > 0) {
        // Rubber-band resistance: feels heavier the further you pull
        const distance = Math.min(dy * 0.45, threshold * 1.8);
        setPullDistance(distance);
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current || disabled) return;
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


