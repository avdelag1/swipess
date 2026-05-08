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
  const threshold = opts?.threshold ?? 90;
  const y = useMotionValue(0);
  // Curtain: smooth linear fall, light scale-down, fade out as it goes
  const scale = useTransform(y, [0, 180, 420], [1, 0.93, 0.78], { clamp: true });
  const opacity = useTransform(y, [0, 100, 280], [1, 0.85, 0], { clamp: true });
  const blur = useTransform(y, [0, 160, 320], ['blur(0px)', 'blur(3px)', 'blur(12px)'], { clamp: true });

  // Backdrop reveal — dashboard sitting behind the deck.
  const backdropOpacity = useTransform(y, [0, 12, 120], [0, 0.6, 1], { clamp: true });
  const backdropScale = useTransform(y, [0, 180], [0.97, 1], { clamp: true });
  const backdropBlur = useTransform(y, [0, 180], ['blur(8px)', 'blur(0px)'], { clamp: true });

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

  const commitDismiss = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    active.current = false;
    triggerHaptic('medium');
    animate(y, 560, { duration: 0.26, ease: [0.32, 0.72, 0, 1] });
    setTimeout(() => {
      setActiveCategory(null as any);
      navigate(`/${activeMode}/dashboard`);
      y.set(0);
      exiting.current = false;
    }, 180);
  }, [activeMode, navigate, setActiveCategory, y]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting.current) return;
    if ((e.target as HTMLElement)?.closest('[data-no-pull-dismiss], [data-no-cinematic], button, a')) return;
    // Restrict to a thin top zone so the rest of the card is free for vertical
    // like/pass swipes. Anything above ~110px from the top of the viewport
    // (header chrome + a small grab strip) can initiate the deck-exit curtain.
    if (e.clientY > 110) return;
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
      // Snappy vertical lock — engage on the smallest clear downward intent.
      if (dy > 6 && dy > dx * 1.6) {
        active.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } else if (dx > 6) {
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
    animate(y, 0, { type: 'spring', stiffness: 520, damping: 38, mass: 0.55 });
  };

  const onPointerUp = () => {
    if (!active.current) {
      reset();
      return;
    }
    const current = y.get();
    // Flick-to-dismiss: a fast downward flick commits even if distance is short
    const flicked = velocity.current > 0.55 && current > 30;
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
      if (!touch || touch.clientY > 110) return;
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
        if (dy > 6 && dy > dx * 1.6) active.current = true;
        else if (dx > 6) {
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
      const flicked = velocity.current > 0.55 && cur > 30;
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
