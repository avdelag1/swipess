/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SCROLL BOUNCE PHYSICS — "Liquid Momentum" Effect
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  Attaches to a horizontally-scrollable container and makes its
 *  children react physically to scroll velocity:
 *
 *    ▸ Each child tilts in the scroll direction (like cards on a rail)
 *    ▸ Children closer to the edges compress slightly (perspective)
 *    ▸ On scroll stop, everything springs back with elastic overshoot
 *    ▸ Rubber-band bounce at the scroll boundaries
 *
 *  100 % CSS-transform driven (GPU composited, zero layout thrash).
 */

import { useRef, useCallback, useEffect } from 'react';

interface ScrollBounceOptions {
  /** Max rotation in degrees during scroll. Default 8 */
  maxTilt?: number;
  /** Max translateY bounce in px. Default 4 */
  maxBounce?: number;
  /** Velocity damping factor 0-1.  Higher = more immediate. Default 0.15 */
  damping?: number;
  /** Spring stiffness for the settle animation (0-1). Default 0.08 */
  springStiffness?: number;
  /** Scale compression at edges. Default 0.94 */
  edgeScale?: number;
  /** Selector for children to animate. Default '> *' */
  childSelector?: string;
}

export function useScrollBounce(options: ScrollBounceOptions = {}) {
  const {
    maxTilt = 6,
    maxBounce = 3,
    damping = 0.15,
    springStiffness = 0.08,
    edgeScale = 0.96,
    childSelector = '> *',
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(0);          // current smoothed velocity
  const lastScrollRef = useRef(0);        // previous scrollLeft
  const lastTimeRef = useRef(0);          // previous timestamp
  const rafRef = useRef<number>(0);       // animation frame id
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Physics tick ──────────────────────────────────────────────────
  const applyPhysics = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scopedSelector = childSelector.startsWith('>') ? childSelector.split(',').map(s => `:scope ${s.trim()}`).join(', ') : childSelector;
    const children = container.querySelectorAll(scopedSelector) as NodeListOf<HTMLElement>;
    if (!children.length) return;

    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const halfWidth = containerRect.width / 2;

    // Clamp velocity to a sane range
    const vel = Math.max(-1, Math.min(1, velocityRef.current));

    children.forEach((child) => {
      const childRect = child.getBoundingClientRect();
      const childCenterX = childRect.left + childRect.width / 2;

      // Normalized position: -1 (left edge) to +1 (right edge)
      const normalizedPos = (childCenterX - centerX) / halfWidth;
      const clampedPos = Math.max(-1, Math.min(1, normalizedPos));

      // ── Tilt: rotateZ proportional to velocity ────────────────
      // Children at the edges tilt more than center ones
      const posInfluence = 0.5 + 0.5 * Math.abs(clampedPos);
      const tilt = vel * maxTilt * posInfluence;

      // ── Bounce: translateY based on velocity wave ─────────────
      // Creates a sinusoidal wave across children
      const phase = clampedPos * Math.PI;
      const bounce = vel * maxBounce * Math.sin(phase);

      // ── Edge compression: items near edges scale down slightly ─
      const edgeFactor = Math.abs(clampedPos);
      const absVel = Math.abs(vel);
      const scale = 1 - (1 - edgeScale) * edgeFactor * absVel;

      // ── Slight horizontal skew for liquid feel ────────────────
      const skew = vel * 2 * posInfluence;

      child.style.transform =
        `translateY(${bounce}px) rotateZ(${tilt}deg) skewY(${skew}deg) scale(${scale.toFixed(4)})`;
      child.style.transition = isScrollingRef.current
        ? 'transform 0.05s linear'        // During scroll: near-instant follow
        : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Settle: springy overshoot
    });
  }, [maxTilt, maxBounce, edgeScale, childSelector]);

  // ── Spring settle loop (runs after scroll stops) ──────────────────
  const settleLoop = useCallback(() => {
    // Decay velocity toward 0 with spring
    velocityRef.current *= (1 - springStiffness);

    // If effectively zero, stop
    if (Math.abs(velocityRef.current) < 0.001) {
      velocityRef.current = 0;
      applyPhysics();
      return;
    }

    applyPhysics();
    rafRef.current = requestAnimationFrame(settleLoop);
  }, [springStiffness, applyPhysics]);

  // ── Scroll handler ────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    const dx = container.scrollLeft - lastScrollRef.current;

    // Raw velocity (px/ms), normalized to [-1, 1]
    const rawVel = dt > 0 ? dx / dt : 0;
    const normalizedVel = Math.max(-1, Math.min(1, rawVel * 2));

    // Smooth velocity with exponential moving average
    velocityRef.current += (normalizedVel - velocityRef.current) * damping;

    lastScrollRef.current = container.scrollLeft;
    lastTimeRef.current = now;
    isScrollingRef.current = true;

    // Cancel any pending settle
    cancelAnimationFrame(rafRef.current);
    clearTimeout(scrollTimeoutRef.current);

    applyPhysics();

    // Detect scroll stop → start settle spring
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      settleLoop();
    }, 80);
  }, [damping, applyPhysics, settleLoop]);

  // ── Rubber-band bounce at boundaries ──────────────────────────────
  const handleOverscroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const atStart = container.scrollLeft <= 0;
    const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

    if (atStart && velocityRef.current < -0.05) {
      // Bounce right (overscroll left)
      velocityRef.current = Math.abs(velocityRef.current) * 0.6;
      isScrollingRef.current = false;
      settleLoop();
    } else if (atEnd && velocityRef.current > 0.05) {
      // Bounce left (overscroll right)
      velocityRef.current = -Math.abs(velocityRef.current) * 0.6;
      isScrollingRef.current = false;
      settleLoop();
    }
  }, [settleLoop]);

  // ── Attach/detach ─────────────────────────────────────────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    lastScrollRef.current = container.scrollLeft;
    lastTimeRef.current = performance.now();

    const onScroll = () => {
      handleScroll();
      handleOverscroll();
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(scrollTimeoutRef.current);

      // Reset transforms on unmount
      const cleanupSelector = childSelector.startsWith('>') ? childSelector.split(',').map(s => `:scope ${s.trim()}`).join(', ') : childSelector;
      const children = container.querySelectorAll(cleanupSelector) as NodeListOf<HTMLElement>;
      children.forEach((child) => {
        child.style.transform = '';
        child.style.transition = '';
      });
    };
  }, [handleScroll, handleOverscroll, childSelector]);

  return scrollRef;
}
