import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';

interface PullToRefreshOptions {
  /** Element to attach to (defaults to window) */
  containerRef?: React.RefObject<HTMLElement>;
  /** Whether to disable pull-to-refresh */
  disabled?: boolean;
  /** Distance threshold to trigger refresh (px) */
  threshold?: number;
  /** Optional custom refresh callback */
  onRefresh?: () => void | Promise<void>;
}

/**
 * ðŸš€ Native-feeling pull-to-refresh for mobile PWA
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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);
  // Tracks pull distance in handlers without re-triggering the effect on every move
  const pullDistanceRef = useRef(0);
  // Fires the "release to refresh" haptic detent once per threshold crossing.
  const thresholdReachedRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Native Haptics on device (Capacitor) with a web-vibrate fallback.
    triggerHaptic('medium');

    // 🚀 MINIMUM DURATION: Ensure the user sees the loader doing its work.
    const minWait = new Promise(resolve => setTimeout(resolve, 900));

    try {
      if (onRefresh) {
        await Promise.all([onRefresh(), minWait]);
      } else {
        await minWait;
        // Simple, reliable hard reload for PWA
        window.location.reload();
      }
    } catch (e) {
      logger.error("Refresh failed", e);
    } finally {
      setIsRefreshing(false);
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (disabled) {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      pulling.current = false;
      return;
    }

    const el = containerRef?.current || document.documentElement;

    const onTouchStart = (e: TouchEvent) => {
      if (disabled) return;
      // Only start pull if we're at the very top of the scroll container
      // AND the touch starts at the very top of the screen (top 120px)
      // This prevents accidental refreshes when scrolling from the middle of the screen
      const touchY = e.touches[0].clientY;
      if (el.scrollTop <= 0 && !isRefreshing && touchY <= 120) {
        startY.current = touchY;
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

      // ðŸ›¡ï¸ SWIPE PROTECTION: If the user is swiping horizontally (like on a card),
      // or if they are scrolling up, cancel the pull immediately.
      if (dy < 0 || (dx > Math.abs(dy) && dy < 20)) {
        pulling.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        thresholdReachedRef.current = false;
        return;
      }

      if (dy > 0) {
        // Rubber-band resistance: feels heavier the further you pull
        const distance = Math.min(dy * 0.45, threshold * 1.8);
        pullDistanceRef.current = distance;
        setPullDistance(distance);
        // Native detent: a single light tick the moment you cross the threshold.
        if (distance >= threshold && !thresholdReachedRef.current) {
          thresholdReachedRef.current = true;
          triggerHaptic('light');
        } else if (distance < threshold && thresholdReachedRef.current) {
          thresholdReachedRef.current = false;
        }
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current || disabled) return;
      pulling.current = false;
      thresholdReachedRef.current = false;
      // Use ref value so this closure doesn't need pullDistance in the dep array
      if (pullDistanceRef.current >= threshold) {
        handleRefresh();
      } else {
        pullDistanceRef.current = 0;
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
  }, [containerRef, threshold, isRefreshing, handleRefresh, disabled]);

  return { isRefreshing, pullDistance, triggered: pullDistance >= threshold };
}
