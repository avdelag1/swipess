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

  const wasActiveRef = useRef(false);
  const isMovingRef = useRef(false);

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

  const currentPosRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });

  const applyZoomPan = useCallback((clientX: number, clientY: number, immediate = false) => {
    const container = containerRef.current;
    const img = imageRef.current || findImage();
    if (!container || !img) return;

    const rect = container.getBoundingClientRect();

    // SMOOTHING: Use lerp to prevent jittery movement
    if (immediate) {
      currentPosRef.current = { x: clientX, y: clientY };
    } else {
      const lerp = 0.15; // Smooth but responsive
      currentPosRef.current.x += (clientX - currentPosRef.current.x) * lerp;
      currentPosRef.current.y += (clientY - currentPosRef.current.y) * lerp;
    }

    const { x, y } = currentPosRef.current;

    // Clamp finger position to container bounds for smooth edge behavior
    const nx = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (y - rect.top) / rect.height));

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
    if (isMovingRef.current) return;
    
    magnifierState.current = { isActive: true, x, y };
    triggerHaptic('light');
    onActiveChange?.(true);
    findImage();

    // Capture pointer so we keep getting events even if finger leaves the element
    if (target && pointerIdRef.current !== null) {
      try {
        (target as HTMLElement).setPointerCapture(pointerIdRef.current);
      } catch (_err) { /* ignore if already captured */ }
    }

    savedOverflowsRef.current = [];

    const img = imageRef.current;
    if (img) {
      img.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    applyZoomPan(x, y, true);

    setTimeout(() => {
      if (imageRef.current && magnifierState.current.isActive) {
        imageRef.current.style.transition = 'none';
      }
    }, 200);
  }, [applyZoomPan, findImage, onActiveChange]);

  const deactivateMagnifier = useCallback(() => {
    if (!magnifierState.current.isActive && !holdTimerRef.current) return;
    
    const wasActive = magnifierState.current.isActive;
    magnifierState.current = { isActive: false, x: 0, y: 0 };
    
    if (wasActive) {
      onActiveChange?.(false);
      wasActiveRef.current = true;
      setTimeout(() => {
        wasActiveRef.current = false;
      }, 150); // Grace period to prevent photo changes on lift
    }

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
      } catch (_err) { /* ignore */ }
    }
    pointerIdRef.current = null;

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
    isMovingRef.current = false;
  }, [onActiveChange]);

  const updateMagnifier = useCallback((x: number, y: number) => {
    if (!magnifierState.current.isActive) return;
    magnifierState.current.x = x;
    magnifierState.current.y = y;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyZoomPan(x, y, false);
    });
  }, [applyZoomPan]);

  // --- Pointer handlers ---

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled || !e.isPrimary) return;

    pointerIdRef.current = e.pointerId;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isMovingRef.current = false;

    const target = e.currentTarget;

    try {
      (target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_err) { /* ignore */ }

    holdTimerRef.current = window.setTimeout(() => {
      if (startPosRef.current && !isMovingRef.current) {
        activateMagnifier(startPosRef.current.x, startPosRef.current.y, target);
      }
    }, holdDelay);
  }, [enabled, holdDelay, activateMagnifier]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    if (magnifierState.current.isActive) {
      e.preventDefault();
      e.stopPropagation();
      updateMagnifier(e.clientX, e.clientY);
      return;
    }

    if (holdTimerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      
      // If they move too much, it's a swipe, not a hold
      // LOOSENED: 25px tolerance for natural finger micro-movement
      if (dx > 25 || dy > 25) {
        isMovingRef.current = true;
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      // CRITICAL: Do NOT update startPosRef.current here. 
      // Keeping it locked to the initial onPointerDown position prevents "photo swimming" 
      // where the zoom center drifts while the user is still waiting for activation.
    }
  }, [updateMagnifier]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    deactivateMagnifier();
  }, [deactivateMagnifier]);

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    deactivateMagnifier();
  }, [deactivateMagnifier]);

  const onPointerLeave = useCallback((_e: React.PointerEvent) => {
    // Keep active
  }, []);

  const isActive = useCallback(() => magnifierState.current.isActive, []);
  const wasActive = useCallback(() => wasActiveRef.current, []);
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
    wasActive,
    isHoldPending,
  };
}


