/**
 * PRESS-AND-HOLD FULL-IMAGE ZOOM + PAN HOOK
 *
 * Hold ~1 second to activate edge-to-edge zoom.
 * Once zoomed, freely drag finger to pan around the image.
 * Release to smoothly snap back to normal.
 *
 * Uses GPU-accelerated CSS transforms for 60fps performance.
 */

import { useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '@/utils/haptics';

interface MagnifierConfig {
  /** Zoom level (2.0 = 200%). Default: 2.8 */
  scale?: number;
  /** Hold time in ms before activation. Default: 800 */
  holdDelay?: number;
  /** Whether enabled. Default: true */
  enabled?: boolean;
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
}

export function useMagnifier(config: MagnifierConfig = {}): UseMagnifierReturn {
  const {
    scale = 2.8,
    holdDelay = 800,
    enabled = true,
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const magnifierState = useRef<MagnifierState>({
    isActive: false,
    x: 0,
    y: 0,
  });

  // Cleanup on unmount
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

  /**
   * Apply zoom + pan transform.
   * The image is scaled from center, then translated so the finger
   * position reveals the corresponding part of the zoomed image.
   *
   * Pan calculation:
   *   - finger at center → no translation
   *   - finger at edge → translate to show that edge of the image
   *   - Translation is clamped so the image always fills the viewport
   */
  const applyZoomPan = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    const img = imageRef.current || findImage();
    if (!container || !img) return;

    const rect = container.getBoundingClientRect();

    // Normalised position: 0 = left/top, 1 = right/bottom
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    // Max translation the image can move without showing gaps
    // When scaled by S, the overflow on each side is (S-1)/2 * dimension
    const maxTx = ((scale - 1) / 2) * rect.width;
    const maxTy = ((scale - 1) / 2) * rect.height;

    // Map finger position to translation
    // center (0.5) → 0 translation; edges → ±max
    const tx = (0.5 - nx) * 2 * maxTx;
    const ty = (0.5 - ny) * 2 * maxTy;

    img.style.transformOrigin = 'center center';
    img.style.transform = `scale(${scale}) translate(${tx / scale}px, ${ty / scale}px) translateZ(0)`;
    img.style.transition = 'none'; // No transition during drag for instant response
    img.style.willChange = 'transform';
  }, [scale, findImage]);

  const activateMagnifier = useCallback((x: number, y: number) => {
    magnifierState.current = { isActive: true, x, y };
    triggerHaptic('light');
    findImage();

    // Smooth zoom-in transition
    const img = imageRef.current;
    if (img) {
      img.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    applyZoomPan(x, y);

    // After the zoom-in transition, remove transition for free panning
    setTimeout(() => {
      if (imageRef.current && magnifierState.current.isActive) {
        imageRef.current.style.transition = 'none';
      }
    }, 220);
  }, [applyZoomPan, findImage]);

  const deactivateMagnifier = useCallback(() => {
    magnifierState.current = { isActive: false, x: 0, y: 0 };

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const img = imageRef.current;
    if (img) {
      img.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      img.style.transform = 'scale(1) translate(0px, 0px) translateZ(0)';
      img.style.transformOrigin = 'center center';
      setTimeout(() => {
        if (img) img.style.willChange = 'auto';
      }, 260);
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

    startPosRef.current = { x: e.clientX, y: e.clientY };

    holdTimerRef.current = window.setTimeout(() => {
      // Verify finger hasn't moved much (distinguishes from swipe)
      if (startPosRef.current) {
        activateMagnifier(e.clientX, e.clientY);
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

    // Cancel hold if finger moves too much before activation
    if (holdTimerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > 15 || dy > 15) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        startPosRef.current = null;
      }
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

  const onPointerLeave = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    deactivateMagnifier();
  }, [deactivateMagnifier]);

  const isActive = useCallback(() => magnifierState.current.isActive, []);

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
  };
}
