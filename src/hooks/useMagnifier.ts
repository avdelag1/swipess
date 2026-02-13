/**
 * PRESS-AND-HOLD FULL-IMAGE ZOOM + PAN HOOK
 *
 * Hold briefly to activate edge-to-edge zoom.
 * Once zoomed, freely drag finger to pan around the image.
 * ONLY deactivates when finger is lifted — never on leave/edge.
 * Uses pointer capture to keep tracking even outside the element.
 */

import { useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '@/utils/haptics';

interface MagnifierConfig {
  /** Zoom level. Default: 2.8 */
  scale?: number;
  /** Hold time in ms before activation. Default: 300 */
  holdDelay?: number;
  /** Whether enabled. Default: true */
  enabled?: boolean;
  /** Callback when magnifier activates/deactivates (for re-render triggers) */
  onActiveChange?: (active: boolean) => void;
}

interface MagnifierState {
  isActive: boolean;
  x: number;
  y: number;
}

interface UseMagnifierReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  magnifierState: React.RefObject<MagnifierState>;
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
  };
  isActive: () => boolean;
  isHoldPending: () => boolean;
}

export function useMagnifier(config: MagnifierConfig = {}): UseMagnifierReturn {
  const {
    scale = 2.8,
    holdDelay = 300,
    enabled = true,
    onActiveChange,
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const savedOverflowsRef = useRef<{ el: HTMLElement; overflow: string }[]>([]);

  const magnifierState = useRef<MagnifierState>({
    isActive: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (imageRef.current) {
        imageRef.current.style.transform = '';
        imageRef.current.style.transition = '';
        imageRef.current.style.transformOrigin = '';
      }
    };
  }, []);

  const findImage = useCallback(() => {
    if (!containerRef.current) return null;
    const img = containerRef.current.querySelector('img');
    if (img && img.complete) {
      imageRef.current = img;
      return img;
    }
    return null;
  }, []);

  const applyZoomPan = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    const img = imageRef.current || findImage();
    if (!container || !img) return;

    const rect = container.getBoundingClientRect();

    // Clamp finger position to container bounds for smooth edge behavior
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const maxTx = ((scale - 1) / 2) * rect.width;
    const maxTy = ((scale - 1) / 2) * rect.height;

    const tx = (0.5 - nx) * 2 * maxTx;
    const ty = (0.5 - ny) * 2 * maxTy;

    img.style.transformOrigin = 'center center';
    img.style.transform = `scale(${scale}) translate(${tx / scale}px, ${ty / scale}px) translateZ(0)`;
    img.style.transition = 'none';
    img.style.willChange = 'transform';
  }, [scale, findImage]);

  const activateMagnifier = useCallback((x: number, y: number, target: Element | null) => {
    magnifierState.current = { isActive: true, x, y };
    triggerHaptic('light');
    onActiveChange?.(true);
    findImage();

    // Capture pointer so we keep getting events even if finger leaves the element
    if (target && pointerIdRef.current !== null) {
      try {
        (target as HTMLElement).setPointerCapture(pointerIdRef.current);
      } catch (_) { /* ignore if already captured */ }
    }

    // FIX: Walk up from <img> past container AND its parent (motion.div with overflow-hidden)
    // This prevents the zoomed image from being clipped by parent divs
    const img = imageRef.current;
    const container = containerRef.current;
    if (img && container) {
      savedOverflowsRef.current = [];
      // Walk up 2 levels past container to also clear overflow on the drag wrapper (motion.div)
      const stopAt = container.parentElement?.parentElement || container.parentElement;
      let el: HTMLElement | null = img.parentElement;
      while (el && el !== stopAt) {
        savedOverflowsRef.current.push({ el, overflow: el.style.overflow });
        el.style.overflow = 'visible';
        el = el.parentElement;
      }
    }

    if (img) {
      img.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    applyZoomPan(x, y);

    setTimeout(() => {
      if (imageRef.current && magnifierState.current.isActive) {
        imageRef.current.style.transition = 'none';
      }
    }, 200);
  }, [applyZoomPan, findImage]);

  const deactivateMagnifier = useCallback(() => {
    if (!magnifierState.current.isActive && !holdTimerRef.current) return;
    const wasActive = magnifierState.current.isActive;
    magnifierState.current = { isActive: false, x: 0, y: 0 };
    if (wasActive) onActiveChange?.(false);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Release pointer capture
    if (containerRef.current && pointerIdRef.current !== null) {
      try {
        containerRef.current.releasePointerCapture(pointerIdRef.current);
      } catch (_) { /* ignore */ }
    }
    pointerIdRef.current = null;

    // FIX: Restore all saved overflow values
    for (const { el, overflow } of savedOverflowsRef.current) {
      el.style.overflow = overflow || '';
    }
    savedOverflowsRef.current = [];

    const img = imageRef.current;
    if (img) {
      img.style.transition = 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      img.style.transform = 'scale(1) translate(0px, 0px) translateZ(0)';
      img.style.transformOrigin = 'center center';
      setTimeout(() => {
        if (img) img.style.willChange = 'auto';
      }, 240);
    }

    startPosRef.current = null;
  }, []);

  const updateMagnifier = useCallback((x: number, y: number) => {
    if (!magnifierState.current.isActive) return;
    magnifierState.current.x = x;
    magnifierState.current.y = y;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyZoomPan(x, y);
    });
  }, [applyZoomPan]);

  // --- Pointer handlers ---

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled || !e.isPrimary) return;

    pointerIdRef.current = e.pointerId;
    startPosRef.current = { x: e.clientX, y: e.clientY };

    // Store the event target for later pointer capture
    const target = e.currentTarget;

    holdTimerRef.current = window.setTimeout(() => {
      if (startPosRef.current) {
        activateMagnifier(startPosRef.current.x, startPosRef.current.y, target);
      }
    }, holdDelay);
  }, [enabled, holdDelay, activateMagnifier]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    // If zoomed, ALWAYS follow the finger — this is the key behavior
    if (magnifierState.current.isActive) {
      e.preventDefault();
      e.stopPropagation();
      updateMagnifier(e.clientX, e.clientY);
      return;
    }

    // Before activation: update start position if finger moves slightly
    // This way activation uses the CURRENT finger position, not the stale initial one
    if (holdTimerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      // Only cancel if clearly swiping (large movement)
      if (dx > 15 || dy > 15) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        startPosRef.current = null;
      } else {
        // Keep updating position so activation zooms where finger IS
        startPosRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  }, [updateMagnifier]);

  // ONLY deactivate on finger lift — NOT on leave
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    deactivateMagnifier();
  }, [deactivateMagnifier]);

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    deactivateMagnifier();
  }, [deactivateMagnifier]);

  // Do NOT deactivate on pointer leave — pointer capture keeps tracking
  const onPointerLeave = useCallback((_e: React.PointerEvent) => {
    // Intentionally empty: zoom stays active until finger lifts
  }, []);

  const isActive = useCallback(() => magnifierState.current.isActive, []);
  const isHoldPending = useCallback(() => holdTimerRef.current !== null, []);

  return {
    containerRef,
    magnifierState,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
    },
    isActive,
    isHoldPending,
  };
}
