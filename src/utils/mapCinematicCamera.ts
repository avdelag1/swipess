import type { Map as MapboxMap } from 'mapbox-gl';

/** Default "flying / plane" camera — pitched 3D view */
export const CINEMATIC_PITCH = 60;
export const CINEMATIC_BEARING = 25;
/** Slightly lower pitch on phones — still feels airborne, fewer GPU spikes */
export const CINEMATIC_PITCH_MOBILE = 52;
/** Arc + speed for Mapbox flyTo — higher curve = more dramatic flight path */
export const FLY_CURVE = 1.68;
export const FLY_SPEED = 1.55;
export const FLY_DURATION_MS = 2400;
export const FLY_DURATION_OPEN_MS = 2000;
/** Altitude the open glide starts from. Zoomed in enough that the whole globe
 *  is never shown — the user opens on a calm regional view, not "the world". */
export const CINEMATIC_OPEN_ALTITUDE_ZOOM = 5;
/** Duration of the gentle settle-down onto the user's location on open. */
export const CINEMATIC_OPEN_GLIDE_MS = 2200;
/** Fast snap when map opens — user expects immediate centering, not a 2s flight. */
export const OPEN_CENTER_MS = 380;
export const CINEMATIC_MAX_PITCH_MOBILE = 58;
export const CINEMATIC_MAX_PITCH_DESKTOP = 65;

export function cinematicPitchForViewport(): number {
  return typeof window !== 'undefined' && window.innerWidth < 768
    ? CINEMATIC_PITCH_MOBILE
    : CINEMATIC_PITCH;
}

export function cinematicMaxPitchForViewport(): number {
  return typeof window !== 'undefined' && window.innerWidth < 768
    ? CINEMATIC_MAX_PITCH_MOBILE
    : CINEMATIC_MAX_PITCH_DESKTOP;
}

export function zoomForRadiusKm(km: number): number {
  // Mapbox zoom ≈ log2(circumference / radius_px). At equator,
  // zoom 14 ≈ 1km across screen. This tuned formula keeps the circle
  // visible but NOT covering the entire viewport.
  // 5km → ~13.3, 20km → ~11.3, 40km → ~10.3, 80km → ~9.3
  const z = 14.6 - Math.log2(Math.max(km, 0.5));
  return Math.min(16, Math.max(8.5, z));
}

export function applyCinematicFog(map: MapboxMap, _isLight: boolean): void {
  map.setFog({
    color: 'rgb(200, 220, 240)',
    'high-color': 'rgb(50, 120, 220)',
    'horizon-blend': 0.03,
    'space-color': 'rgb(220, 235, 250)',
    'star-intensity': 0.15,
  });
}

export function addCinematic3DBuildings(map: MapboxMap, _isLight: boolean): void {
  if (map.getLayer('add-3d-buildings')) return;

  const layers = map.getStyle()?.layers;
  let labelLayerId: string | undefined;
  if (layers) {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }
  }

  map.addLayer(
    {
      id: 'add-3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height'],
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height'],
        ],
        'fill-extrusion-opacity': 0.6,
      },
    },
    labelLayerId,
  );
}

export function cinematicEaseTo(
  map: MapboxMap,
  center: [number, number],
  zoom: number,
  opts?: { bearing?: number; duration?: number; pitch?: number },
): void {
  map.easeTo({
    center,
    zoom,
    pitch: opts?.pitch ?? cinematicPitchForViewport(),
    bearing: opts?.bearing ?? map.getBearing(),
    duration: opts?.duration ?? OPEN_CENTER_MS,
    essential: true,
  });
}

export function cinematicFlyTo(
  map: MapboxMap,
  center: [number, number],
  zoom: number,
  opts?: { bearing?: number; pitch?: number; speed?: number; curve?: number; duration?: number },
): void {
  const options: Parameters<MapboxMap['flyTo']>[0] = {
    center,
    zoom,
    pitch: opts?.pitch ?? CINEMATIC_PITCH,
    bearing: opts?.bearing ?? CINEMATIC_BEARING,
    essential: true,
  };
  
  if (opts?.duration) {
    options.duration = opts.duration;
  } else {
    options.speed = opts?.speed ?? 1.2;
    options.curve = opts?.curve ?? 1.68;
  }

  map.flyTo(options);
}

/** Slow start, slow finish — calm cinematic descent (no plunge). */
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/**
 * Gentle "settle down onto the target" open animation. Cuts to a calm regional
 * altitude (never the whole globe) then eases smoothly down to the search zoom,
 * decelerating into place for a soft landing instead of a fast dive. Replays on
 * every open, including the warm/persistent map that retains its last view.
 */
export function cinematicOpenGlide(
  map: MapboxMap,
  center: [number, number],
  zoom: number,
  opts?: { pitch?: number; bearing?: number; altitudeZoom?: number; duration?: number },
): void {
  const pitch = opts?.pitch ?? cinematicPitchForViewport();
  const bearing = opts?.bearing ?? CINEMATIC_BEARING;
  map.jumpTo({
    center,
    zoom: opts?.altitudeZoom ?? CINEMATIC_OPEN_ALTITUDE_ZOOM,
    pitch,
    bearing,
  });
  map.easeTo({
    center,
    zoom,
    pitch,
    bearing,
    duration: opts?.duration ?? CINEMATIC_OPEN_GLIDE_MS,
    easing: easeInOutCubic,
    essential: true,
  });
}

/** Zoom step per double-tap — one natural "notch" in, like Google/Apple Maps.
 *  (A large step felt like a teleport and made repeat double-taps unusable.) */
export const DOUBLE_TAP_ZOOM_STEP = 2.0;
export const DOUBLE_TAP_MAX_ZOOM = 18.5;
const DOUBLE_TAP_ZOOM_MS = 380;

/** Quick ease-in at the tap point; repeat double-taps stack for gradual zoom. */
export function incrementalDoubleTapZoom(
  map: MapboxMap,
  center: [number, number],
): boolean {
  const current = map.getZoom();
  const next = Math.min(DOUBLE_TAP_MAX_ZOOM, current + DOUBLE_TAP_ZOOM_STEP);
  if (next <= current + 0.01) return false;

  map.easeTo({
    around: center,
    zoom: next,
    pitch: cinematicPitchForViewport(),
    bearing: map.getBearing(),
    duration: DOUBLE_TAP_ZOOM_MS,
    easing: (t: number) => 1 - (1 - t) ** 3,
    essential: true,
  });
  return true;
}