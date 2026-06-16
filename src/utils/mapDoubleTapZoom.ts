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

/** Double-tap on HTML marker elements (map click never fires through markers). */
export function bindMarkerDoubleTapZoom(
  el: HTMLElement,
  getCenter: () => [number, number],
  mapRef: { current: MapboxMap | null },
  lastZoomAtRef: { current: number },
  onSingleTap: () => void,
  isActive: () => boolean,
  onZoom?: () => void,
): () => void {
  let lastTap: MapTapPoint | null = null;
  let singleTapTimer: ReturnType<typeof setTimeout> | null = null;

  const onPointerUp = (e: PointerEvent) => {
    if (!isActive()) return;
    e.stopPropagation();

    const now = Date.now();
    const x = e.clientX;
    const y = e.clientY;
    const map = mapRef.current;

    if (map && isMapDoubleTap(lastTap, now, x, y)) {
      e.preventDefault();
      if (singleTapTimer) {
        clearTimeout(singleTapTimer);
        singleTapTimer = null;
      }
      if (tryMapDoubleTapZoom(map, getCenter(), lastZoomAtRef)) {
        lastTap = null;
        onZoom?.();
      }
      return;
    }

    lastTap = { time: now, x, y };
    if (singleTapTimer) clearTimeout(singleTapTimer);
    const tapTime = now;
    singleTapTimer = setTimeout(() => {
      if (lastTap?.time === tapTime) {
        onSingleTap();
        lastTap = null;
      }
      singleTapTimer = null;
    }, MAP_DOUBLE_TAP_WINDOW_MS);
  };

  el.addEventListener('pointerup', onPointerUp);
  return () => {
    if (singleTapTimer) clearTimeout(singleTapTimer);
    el.removeEventListener('pointerup', onPointerUp);
  };
}