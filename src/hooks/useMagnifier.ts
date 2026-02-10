/**
 * PRESS-AND-HOLD FULL-IMAGE ZOOM HOOK
 *
 * Creates a premium full-image zoom effect on long-press.
 * Uses GPU-accelerated CSS transforms for instant 60fps performance.
 *
 * Features:
 * - 300ms press-and-hold activation
 * - ENTIRE image zooms (no lens/frame/clipping)
 * - Zoom follows finger position smoothly
 * - Haptic feedback on activation
 * - No layout changes or DOM reflow
 *
 * DESIGN GOALS:
 * - Zoom the entire image layer, not a circular lens
 * - No clipping, masks, frames, or overflow hidden
 * - No visible lens UI
 * - Zoom feels like the image itself bends under the finger
 * - Release removes zoom instantly
 */

import { useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '@/utils/haptics';

interface MagnifierConfig {
  /** Zoom level (2.0 = 200% zoom). Default: 2.5 */
  scale?: number;
  /** Time in ms before magnifier activates. Default: 300 */
  holdDelay?: number;
  /** Whether magnifier is enabled. Default: true */
  enabled?: boolean;
}

interface MagnifierState {
  isActive: boolean;
  x: number;
  y: number;
}

interface UseMagnifierReturn {
  /** Ref to attach to the image container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Current magnifier state */
  magnifierState: React.RefObject<MagnifierState>;
  /** Pointer event handlers */
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
  };
  /** Whether magnifier is currently active */
  isActive: () => boolean;
}

export function useMagnifier(config: MagnifierConfig = {}): UseMagnifierReturn {
  const {
    scale = 2.5, // Full-image zoom level (2.5 = 250%)
    holdDelay = 300,
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
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Reset image transform on unmount
      if (imageRef.current) {
        imageRef.current.style.transform = '';
        imageRef.current.style.transition = '';
      }
    };
  }, []);

  // Find the image element within the container
  const findImage = useCallback(() => {
    if (!containerRef.current) return null;
    const img = containerRef.current.querySelector('img');
    if (img && img.complete) {
      imageRef.current = img;
      return img;
    }
    return null;
  }, []);

  // Apply full-image zoom with GPU-accelerated transforms
  const applyZoom = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    const img = imageRef.current || findImage();

    if (!container || !img) return;

    // Get container dimensions and mouse position relative to container
    const rect = container.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Calculate transform origin as percentage of container
    // This makes the zoom center on the finger position
    const originX = (relX / rect.width) * 100;
    const originY = (relY / rect.height) * 100;

    // Apply GPU-accelerated transform
    // transformOrigin sets zoom center, scale zooms the image
    img.style.transformOrigin = `${originX}% ${originY}%`;
    img.style.transform = `scale(${scale}) translateZ(0)`;
    img.style.transition = 'transform 0.15s ease-out';
    img.style.willChange = 'transform';

  }, [scale, findImage]);

  // Activate full-image zoom
  const activateMagnifier = useCallback((x: number, y: number) => {
    magnifierState.current = { isActive: true, x, y };

    // Haptic feedback on activation
    triggerHaptic('light');

    // Find and cache image
    findImage();

    // Apply zoom transform
    applyZoom(x, y);
  }, [applyZoom, findImage]);

  // Deactivate zoom
  const deactivateMagnifier = useCallback(() => {
    magnifierState.current = { isActive: false, x: 0, y: 0 };

    // Clear timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Cancel RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Reset image transform with smooth transition
    const img = imageRef.current;
    if (img) {
      img.style.transition = 'transform 0.15s ease-out';
      img.style.transform = 'scale(1) translateZ(0)';
      img.style.transformOrigin = 'center center';
      // Clean up willChange after transition
      setTimeout(() => {
        if (img) img.style.willChange = 'auto';
      }, 150);
    }

    startPosRef.current = null;
  }, []);

  // Update zoom position (throttled via RAF)
  const updateMagnifier = useCallback((x: number, y: number) => {
    if (!magnifierState.current.isActive) return;

    magnifierState.current.x = x;
    magnifierState.current.y = y;

    // Use RAF for smooth 60fps updates
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      applyZoom(x, y);
    });
  }, [applyZoom]);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    
    // Only handle primary pointer (finger/mouse)
    if (!e.isPrimary) return;
    
    // Store starting position
    startPosRef.current = { x: e.clientX, y: e.clientY };
    
    // Start hold timer
    holdTimerRef.current = window.setTimeout(() => {
      // Check if pointer hasn't moved much (to distinguish from swipe)
      if (startPosRef.current) {
        const dx = Math.abs(e.clientX - startPosRef.current.x);
        const dy = Math.abs(e.clientY - startPosRef.current.y);
        
        // Only activate if finger stayed relatively still
        if (dx < 15 && dy < 15) {
          activateMagnifier(e.clientX, e.clientY);
        }
      }
    }, holdDelay);
  }, [enabled, holdDelay, activateMagnifier]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    
    // If magnifier is active, update position
    if (magnifierState.current.isActive) {
      e.preventDefault();
      e.stopPropagation();
      updateMagnifier(e.clientX, e.clientY);
      return;
    }
    
    // If holding but haven't activated yet, check for movement
    if (holdTimerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      
      // If moved too much, cancel activation (user is swiping)
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
