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
  const threshold = opts?.threshold ?? 56;
  const y = useMotionValue(0);
  // Curtain: silky fall — eased scale-down with deep fade for a clean reveal.
  const scale = useTransform(y, [0, 200, 500], [1, 0.92, 0.7], { clamp: true });
  const opacity = useTransform(y, [0, 80, 260], [1, 0.88, 0], { clamp: true });
  const blur = useTransform(y, [0, 140, 280], ['blur(0px)', 'blur(2px)', 'blur(10px)'], { clamp: true });

  // Backdrop reveal — dashboard rises up smoothly behind the deck.
  const backdropOpacity = useTransform(y, [0, 8, 90], [0, 0.55, 1], { clamp: true });
  const backdropScale = useTransform(y, [0, 140], [0.94, 1], { clamp: true });
  const backdropBlur = useTransform(y, [0, 140], ['blur(10px)', 'blur(0px)'], { clamp: true });

  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const startT = useRef<number>(0);
  const lastY = useRef<number>(0);
  const lastT = useRef<number>(0);
  const velocity = useRef<number>(0);
  const active = useRef(false);
  const exiting = useRef(false);

  const { navigate } = useAppNavigate();
  const { activeMode } = useActiveMode();
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);
  const activeCategory = useFilterStore((s) => s.activeCategory);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);

  // Whenever a new deck opens (category changes to a non-null value), make
  // sure the pull-down motion value is fully reset. This prevents a stuck
  // off-screen / faded deck after a previous dismissal.
  useEffect(() => {
    if (activeCategory) {
      animationRef.current?.stop();
      animationRef.current = null;
      y.set(0);
      exiting.current = false;
      active.current = false;
      startY.current = null;
      startX.current = null;
    }
  }, [activeCategory, y]);

  const commitDismiss = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    active.current = false;
    triggerHaptic('medium');
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
    animationRef.current?.stop();
    animationRef.current = animate(y, vh * 0.95, { duration: 0.34, ease: [0.22, 1, 0.36, 1] });
    setTimeout(() => {
      animationRef.current?.stop();
      animationRef.current = null;
      setActiveCategory(null as any);
      navigate(`/${activeMode}/dashboard`);
      y.set(0);
      exiting.current = false;
    }, 240);
  }, [activeMode, navigate, setActiveCategory, y]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting.current) return;
    if ((e.target as HTMLElement)?.closest('[data-no-pull-dismiss], [data-no-cinematic], button, a')) return;
    // Only the physical top edge can close the deck. Card-body vertical swipes
    // are reserved for strict story-style paging between listings/profiles.
    if (e.clientY > 64) return;
    startY.current = e.clientY;
    startX.current = e.clientX;
    startT.current = performance.now();
    lastY.current = e.clientY;
    lastT.current = startT.current;
    velocity.current = 0;
    active.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null || startX.current == null) return;
    const dy = e.clientY - startY.current;
    const dx = Math.abs(e.clientX - startX.current);
    if (!active.current) {
      // Sensitive only from the top edge; no free card-body curtain dragging.
      if (dy > 2 && dy > dx * 1.2) {
        active.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } else if (dx > 10) {
        // Horizontal motion — abandon the pull
        startY.current = null;
        startX.current = null;
        return;
      } else {
        return;
      }
    }
    // Track velocity (px/ms) for flick-to-dismiss
    const now = performance.now();
    const dt = Math.max(1, now - lastT.current);
    velocity.current = (e.clientY - lastY.current) / dt;
    lastY.current = e.clientY;
    lastT.current = now;
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
    animate(y, 0, { type: 'spring', stiffness: 620, damping: 44, mass: 0.5 });
  };

  const onPointerUp = () => {
    if (!active.current) {
      reset();
      return;
    }
    const current = y.get();
    // Flick-to-dismiss: even a soft downward flick commits.
    const flicked = velocity.current > 0.25 && current > 16;
    if (current >= threshold || flicked) {
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
      if (!touch || touch.clientY > 64) return;
      touchId = touch.identifier;
      startY.current = touch.clientY;
      startX.current = touch.clientX;
      startT.current = performance.now();
      lastY.current = touch.clientY;
      lastT.current = startT.current;
      velocity.current = 0;
      active.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY.current == null || startX.current == null || touchId == null) return;
      const touch = Array.from(event.touches).find(t => t.identifier === touchId);
      if (!touch) return;
      const dy = touch.clientY - startY.current;
      const dx = Math.abs(touch.clientX - startX.current);
      if (!active.current) {
        if (dy > 2 && dy > dx * 1.2) active.current = true;
        else if (dx > 10) {
          startY.current = null;
          startX.current = null;
          touchId = null;
          return;
        } else return;
      }
      const now = performance.now();
      const dt = Math.max(1, now - lastT.current);
      velocity.current = (touch.clientY - lastY.current) / dt;
      lastY.current = touch.clientY;
      lastT.current = now;
      event.preventDefault();
      const pull = Math.max(0, dy);
      y.set(pull);
    };

    const onTouchEnd = () => {
      if (touchId == null && !active.current) return;
      touchId = null;
      if (!active.current) { reset(); return; }
      const cur = y.get();
      const flicked = velocity.current > 0.25 && cur > 16;
      (cur >= threshold || flicked) ? commitDismiss() : reset();
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
