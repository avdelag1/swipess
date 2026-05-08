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
  const threshold = opts?.threshold ?? 110;
  const y = useMotionValue(0);
  // Curtain: smooth linear fall, light scale-down, fade out as it goes
  const scale = useTransform(y, [0, 200, 420], [1, 0.92, 0.78], { clamp: true });
  const opacity = useTransform(y, [0, 120, 300], [1, 0.85, 0], { clamp: true });
  const blur = useTransform(y, [0, 180, 340], ['blur(0px)', 'blur(4px)', 'blur(14px)'], { clamp: true });

  // Backdrop reveal — dashboard sitting behind the deck.
  const backdropOpacity = useTransform(y, [0, 20, 160], [0, 0.5, 1], { clamp: true });
  const backdropScale = useTransform(y, [0, 200], [0.96, 1], { clamp: true });
  const backdropBlur = useTransform(y, [0, 200], ['blur(10px)', 'blur(0px)'], { clamp: true });

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
      // Strict vertical lock — engage only on clear downward motion.
      if (dy > 10 && dy > dx * 2.2) {
        active.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } else if (dx > 8) {
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
    // Pure vertical curtain — no horizontal influence at all
    const pull = Math.max(0, dy);
    y.set(pull);
  };

  const reset = () => {
    startY.current = null;
    startX.current = null;
    active.current = false;
    animate(y, 0, { type: 'spring', stiffness: 380, damping: 36, mass: 0.6 });
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
        if (dy > 10 && dy > dx * 2.2) active.current = true;
        else if (dx > 10) {
          startY.current = null;
          startX.current = null;
          touchId = null;
          return;
        } else return;
      }
      event.preventDefault();
      const pull = Math.max(0, dy);
      y.set(pull);
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
    backdropOpacity,
    backdropScale,
    backdropBlur,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
    },
  };
}
