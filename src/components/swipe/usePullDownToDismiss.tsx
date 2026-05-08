import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useFilterStore } from '@/state/filterStore';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Pull-down-to-dismiss gesture for the swipe deck.
 * User pulls down from the top of the screen → deck shrinks/fades elastically
 * → on release past threshold → exits back to the dashboard category picker.
 *
 * Returns motion values to bind to a wrapper around the deck:
 *   { y, scale, opacity, bind }  — bind is a set of pointer handlers.
 */
export function usePullDownToDismiss(opts?: { threshold?: number }) {
  const threshold = opts?.threshold ?? 118;
  const y = useMotionValue(0);
  const scale = useTransform(y, [0, 220, 380], [1, 0.88, 0.68], { clamp: true });
  const opacity = useTransform(y, [0, 70, 240], [1, 0.96, 0.12], { clamp: true });
  const blur = useTransform(y, [0, 160, 320], ['blur(0px)', 'blur(7px)', 'blur(18px)'], { clamp: true });

  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const active = useRef(false);
  const exiting = useRef(false);

  const { navigate } = useAppNavigate();
  const { activeMode } = useActiveMode();
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);

  const commitDismiss = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    active.current = false;
    triggerHaptic('medium');
    animate(y, 520, { duration: 0.34, ease: [0.22, 1, 0.36, 1] });
    setTimeout(() => {
      setActiveCategory(null as any);
      navigate(`/${activeMode}/dashboard`);
      y.set(0);
      exiting.current = false;
    }, 240);
  }, [activeMode, navigate, setActiveCategory, y]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting.current) return;
    if ((e.target as HTMLElement)?.closest('[data-no-pull-dismiss], [data-no-cinematic], button, a')) return;
    // Only initiate when the touch starts near the top of the viewport,
    // so the swipe-card horizontal/zoom gestures stay untouched.
    if (e.clientY > 150) return;
    startY.current = e.clientY;
    startX.current = e.clientX;
    active.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null || startX.current == null) return;
    const dy = e.clientY - startY.current;
    const dx = Math.abs(e.clientX - startX.current);
    if (!active.current) {
      // Lock in only on a clear vertical-down intention (avoid hijacking horizontal swipes)
      if (dy > 14 && dy > dx * 1.4) {
        active.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } else if (dx > 12) {
        // Horizontal motion — abandon the pull
        startY.current = null;
        startX.current = null;
        return;
      } else {
        return;
      }
    }
    e.preventDefault();
    e.stopPropagation();
    // Elastic (rubber-band) translation
    const elastic = dy <= 0 ? 0 : dy < 90 ? dy : 90 + (dy - 90) * 0.72;
    y.set(elastic);
  };

  const reset = () => {
    startY.current = null;
    startX.current = null;
    active.current = false;
    animate(y, 0, { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 });
  };

  const onPointerUp = () => {
    if (!active.current) {
      reset();
      return;
    }
    const current = y.get();
    if (current >= threshold) {
      commitDismiss();
    } else {
      reset();
    }
  };

  useEffect(() => {
    let touchId: number | null = null;

    const onTouchStart = (event: TouchEvent) => {
      if (exiting.current || event.touches.length !== 1) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-no-pull-dismiss], [data-no-cinematic], button, a')) return;
      const touch = event.touches[0];
      if (!touch || touch.clientY > 150) return;
      touchId = touch.identifier;
      startY.current = touch.clientY;
      startX.current = touch.clientX;
      active.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY.current == null || startX.current == null || touchId == null) return;
      const touch = Array.from(event.touches).find(t => t.identifier === touchId);
      if (!touch) return;
      const dy = touch.clientY - startY.current;
      const dx = Math.abs(touch.clientX - startX.current);
      if (!active.current) {
        if (dy > 12 && dy > dx * 1.25) active.current = true;
        else if (dx > 14) {
          startY.current = null;
          startX.current = null;
          touchId = null;
          return;
        } else return;
      }
      event.preventDefault();
      const elastic = dy <= 0 ? 0 : dy < 90 ? dy : 90 + (dy - 90) * 0.72;
      y.set(elastic);
    };

    const onTouchEnd = () => {
      if (touchId == null && !active.current) return;
      touchId = null;
      if (!active.current) { reset(); return; }
      y.get() >= threshold ? commitDismiss() : reset();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [commitDismiss, threshold, y]);

  // Safety: cancel on unmount
  useEffect(() => () => { y.set(0); }, [y]);

  return {
    y,
    scale,
    opacity,
    blur,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
    },
  };
}
