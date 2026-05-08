import { useEffect, useRef } from 'react';
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
  const threshold = opts?.threshold ?? 140;
  const y = useMotionValue(0);
  const scale = useTransform(y, [0, 300], [1, 0.78], { clamp: true });
  const opacity = useTransform(y, [0, 60, 260], [1, 1, 0.2], { clamp: true });

  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const active = useRef(false);
  const startScroll = useRef(0);

  const { navigate } = useAppNavigate();
  const { activeMode } = useActiveMode();
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);

  const onPointerDown = (e: React.PointerEvent) => {
    // Only initiate when the touch starts near the top of the viewport,
    // so the swipe-card horizontal/zoom gestures stay untouched.
    if (e.clientY > 90) return;
    startY.current = e.clientY;
    startX.current = e.clientX;
    startScroll.current = window.scrollY || 0;
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
      } else if (dx > 12) {
        // Horizontal motion — abandon the pull
        startY.current = null;
        startX.current = null;
        return;
      } else {
        return;
      }
    }
    // Elastic (rubber-band) translation
    const elastic = dy <= 0 ? 0 : dy < 80 ? dy : 80 + (dy - 80) * 0.55;
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
      triggerHaptic('medium');
      // Animate card off-screen, then exit
      animate(y, 360, { duration: 0.28, ease: [0.32, 0.72, 0, 1] });
      setTimeout(() => {
        setActiveCategory(null as any);
        navigate(`/${activeMode}/dashboard`);
        // Reset after route change so next mount is fresh
        y.set(0);
      }, 220);
    } else {
      reset();
    }
  };

  // Safety: cancel on unmount
  useEffect(() => () => { y.set(0); }, [y]);

  return {
    y,
    scale,
    opacity,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
    },
  };
}
