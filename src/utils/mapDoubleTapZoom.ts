import type { Map as MapboxMap } from 'mapbox-gl';
import { incrementalDoubleTapZoom } from '@/utils/mapCinematicCamera';

export const MAP_DOUBLE_TAP_WINDOW_MS = 450;
/** Faster sheet open on markers — still leaves room for double-tap zoom on empty map. */
export const MAP_MARKER_TAP_DELAY_MS = 220;
export const MAP_DOUBLE_TAP_SLOP_PX = 72;
export const MAP_LONG_PRESS_MS = 1000;
export const MAP_LONG_PRESS_MOVE_SLOP = 14;

export type MapTapPoint = { time: number; x: number; y: number };

export function isMapDoubleTap(
  last: MapTapPoint | null,
  now: number,
  x: number,
  y: number,
): boolean {
  if (!last) return false;
  return (
    now - last.time < MAP_DOUBLE_TAP_WINDOW_MS
    && Math.hypot(x - last.x, y - last.y) < MAP_DOUBLE_TAP_SLOP_PX
  );
}

/** Screen point → lng/lat for double-tap zoom centered on the finger. */
export function lngLatFromMapClientPoint(
  map: MapboxMap,
  clientX: number,
  clientY: number,
): [number, number] {
  const canvas = map.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const lngLat = map.unproject([clientX - rect.left, clientY - rect.top]);
  return [lngLat.lng, lngLat.lat];
}

export function tryMapDoubleTapZoom(
  map: MapboxMap,
  center: [number, number],
  lastZoomAtRef: { current: number },
  minGapMs = 120,
): boolean {
  const now = Date.now();
  if (now - lastZoomAtRef.current < minGapMs) return false;
  if (!incrementalDoubleTapZoom(map, center)) return false;
  lastZoomAtRef.current = now;
  return true;
}

/** Attach canvas-level double-tap zoom (mobile touchend + desktop click). */
export function bindMapDoubleTapZoom(
  map: MapboxMap,
  opts: {
    isActive: () => boolean;
    lastZoomAtRef: { current: number };
    /** Updated on every canvas pointerup — used to ignore stray map clicks during double-tap. */
    lastPointerUpAtRef?: { current: number };
    onZoom?: () => void;
  },
): () => void {
  const canvas = map.getCanvas();
  let lastTap: MapTapPoint | null = null;
  let singleTapTimer: ReturnType<typeof setTimeout> | null = null;

  const clearSingleTap = () => {
    if (singleTapTimer) {
      clearTimeout(singleTapTimer);
      singleTapTimer = null;
    }
  };

  const handleDoubleTapAt = (x: number, y: number) => {
    if (!opts.isActive()) return;
    clearSingleTap();
    const center = lngLatFromMapClientPoint(map, x, y);
    if (tryMapDoubleTapZoom(map, center, opts.lastZoomAtRef)) {
      lastTap = null;
      opts.onZoom?.();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!opts.isActive()) return;
    const now = Date.now();
    if (opts.lastPointerUpAtRef) opts.lastPointerUpAtRef.current = now;
    const x = e.clientX;
    const y = e.clientY;

    if (isMapDoubleTap(lastTap, now, x, y)) {
      e.preventDefault();
      e.stopPropagation();
      handleDoubleTapAt(x, y);
      return;
    }

    lastTap = { time: now, x, y };
    clearSingleTap();
    singleTapTimer = setTimeout(() => {
      lastTap = null;
      singleTapTimer = null;
    }, MAP_DOUBLE_TAP_WINDOW_MS);
  };

  canvas.addEventListener('pointerup', onPointerUp, { capture: true });

  return () => {
    clearSingleTap();
    canvas.removeEventListener('pointerup', onPointerUp, { capture: true });
  };
}

/** 1s press on empty map → relocate search center to that point. */
export function bindMapLongPress(
  map: MapboxMap,
  opts: {
    isActive: () => boolean;
    onLongPress: (lng: number, lat: number) => void;
    durationMs?: number;
  },
): () => void {
  const canvas = map.getCanvas();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!opts.isActive() || e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      const [lng, lat] = lngLatFromMapClientPoint(map, e.clientX, e.clientY);
      opts.onLongPress(lng, lat);
    }, opts.durationMs ?? MAP_LONG_PRESS_MS);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MAP_LONG_PRESS_MOVE_SLOP) {
      clearTimer();
    }
  };

  const onPointerUp = () => clearTimer();

  // Capture phase: the double-tap zoom binder (also on this canvas) calls
  // stopPropagation() on a detected double-tap. A bubble-phase listener here
  // would be suppressed by that, leaving the long-press timer running so it
  // fires ~1s after a double-tap and wrongly relocates the radar. Capture-phase
  // listeners on the same element still run after a non-immediate
  // stopPropagation, so the timer is always cleared. DO NOT switch to bubble.
  canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
  canvas.addEventListener('pointermove', onPointerMove, { capture: true });
  canvas.addEventListener('pointerup', onPointerUp, { capture: true });
  canvas.addEventListener('pointercancel', onPointerUp, { capture: true });

  return () => {
    clearTimer();
    canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
    canvas.removeEventListener('pointermove', onPointerMove, { capture: true });
    canvas.removeEventListener('pointerup', onPointerUp, { capture: true });
    canvas.removeEventListener('pointercancel', onPointerUp, { capture: true });
  };
}

type MapUserEvent = { originalEvent?: Event };

export function bindMapInteractionTracking(
  map: MapboxMap,
  onUserInteract: () => void,
  shouldIgnore?: (ev: MapUserEvent) => boolean,
): () => void {
  const mark = (ev: MapUserEvent = {}) => {
    if (shouldIgnore?.(ev)) return;
    onUserInteract();
  };
  map.on('dragstart', mark);
  map.on('zoomstart', mark);
  map.on('rotatestart', mark);
  map.on('pitchstart', mark);
  map.on('wheel', mark);
  return () => {
    map.off('dragstart', mark);
    map.off('zoomstart', mark);
    map.off('rotatestart', mark);
    map.off('pitchstart', mark);
    map.off('wheel', mark);
  };
}

export const MAP_MARKER_LONG_PRESS_MS = 400;

/**
 * Tap (instant) + long-press on HTML marker elements.
 *
 * A single tap opens the pin preview immediately — no double-tap wait — so the
 * listing card feels snappy. Zooming lives on the map canvas (double-tap empty
 * map), which keeps pin selection and zoom from fighting each other.
 */
export function bindMarkerGestures(
  el: HTMLElement,
  onTap: () => void,
  onLongPress: () => void,
  isActive: () => boolean,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let isLongPress = false;
  let moved = false;
  let startX = 0;
  let startY = 0;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const start = (e: PointerEvent) => {
    if (!isActive()) return;
    isLongPress = false;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      isLongPress = true;
      onLongPress();
    }, MAP_MARKER_LONG_PRESS_MS);
  };

  const move = (e: PointerEvent) => {
    if (!isActive()) return;
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      moved = true;
      clearTimer();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isActive()) return;
    clearTimer();
    if (!isLongPress && !moved) {
      e.stopPropagation();
      onTap();
    }
  };

  const onPointerCancel = () => clearTimer();

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerCancel);
  return () => {
    clearTimer();
    el.removeEventListener('pointerdown', start);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerCancel);
  };
}