import type { Map as MapboxMap } from 'mapbox-gl';
import { incrementalDoubleTapZoom } from '@/utils/mapCinematicCamera';

export const MAP_DOUBLE_TAP_WINDOW_MS = 450;
export const MAP_DOUBLE_TAP_SLOP_PX = 72;

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
    const rect = canvas.getBoundingClientRect();
    const lngLat = map.unproject([x - rect.left, y - rect.top]);
    if (tryMapDoubleTapZoom(map, [lngLat.lng, lngLat.lat], opts.lastZoomAtRef)) {
      lastTap = null;
      opts.onZoom?.();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!opts.isActive() || e.pointerType === 'mouse') return;
    const now = Date.now();
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

  const onClick = (e: MouseEvent) => {
    if (!opts.isActive()) return;
    const now = Date.now();
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

  const onDblClick = (e: MouseEvent) => {
    if (!opts.isActive()) return;
    e.preventDefault();
    e.stopPropagation();
    handleDoubleTapAt(e.clientX, e.clientY);
  };

  canvas.addEventListener('pointerup', onPointerUp, { capture: true });
  canvas.addEventListener('click', onClick, { capture: true });
  canvas.addEventListener('dblclick', onDblClick, { capture: true });

  return () => {
    clearSingleTap();
    canvas.removeEventListener('pointerup', onPointerUp, { capture: true });
    canvas.removeEventListener('click', onClick, { capture: true });
    canvas.removeEventListener('dblclick', onDblClick, { capture: true });
  };
}

/** Handle tap, long-press, and double-tap on HTML marker elements. */
export function bindMarkerGestures(
  el: HTMLElement,
  getCenter: () => [number, number],
  mapRef: { current: MapboxMap | null },
  lastZoomAtRef: { current: number },
  onTap: () => void,
  onLongPress: () => void,
  isActive: () => boolean,
  onZoom?: () => void,
): () => void {
  let lastTap: MapTapPoint | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let singleTapTimer: ReturnType<typeof setTimeout> | null = null;
  let isLongPress = false;
  let startX = 0;
  let startY = 0;

  const clearSingleTap = () => {
    if (singleTapTimer) {
      clearTimeout(singleTapTimer);
      singleTapTimer = null;
    }
  };

  const start = (e: PointerEvent) => {
    if (!isActive()) return;
    isLongPress = false;
    startX = e.clientX;
    startY = e.clientY;
    timer = setTimeout(() => {
      isLongPress = true;
      onLongPress();
    }, 400);
  };

  const move = (e: PointerEvent) => {
    if (!isActive()) return;
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      if (timer) clearTimeout(timer);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isActive()) return;
    e.stopPropagation();
    if (timer) clearTimeout(timer);

    const now = Date.now();
    const x = e.clientX;
    const y = e.clientY;
    const map = mapRef.current;

    if (!isLongPress) {
      if (map && isMapDoubleTap(lastTap, now, x, y)) {
        clearSingleTap();
        e.preventDefault();
        if (tryMapDoubleTapZoom(map, getCenter(), lastZoomAtRef)) {
          lastTap = null;
          onZoom?.();
          return;
        }
      }

      clearSingleTap();
      lastTap = { time: now, x, y };
      singleTapTimer = setTimeout(() => {
        singleTapTimer = null;
        lastTap = null;
        onTap();
      }, MAP_DOUBLE_TAP_WINDOW_MS);
    }
  };

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', onPointerUp);
  return () => {
    if (timer) clearTimeout(timer);
    clearSingleTap();
    el.removeEventListener('pointerdown', start);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', onPointerUp);
  };
}