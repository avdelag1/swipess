import type { Map as MapboxMap } from 'mapbox-gl';
import { getMapWebGLProfile } from '@/utils/mapWebGLProfile';

/** Default "flying / plane" camera — pitched 3D view */
export const CINEMATIC_PITCH = 60;
export const CINEMATIC_BEARING = 25;
/** Slightly lower pitch on phones — still feels airborne, fewer GPU spikes */
export const CINEMATIC_PITCH_MOBILE = 52;
/** Lite-tier airplane pitch (Safari / mid GPU) — strong 3D without fog/buildings */
export const CINEMATIC_PITCH_LITE = 55;
export const CINEMATIC_PITCH_LITE_MOBILE = 48;
export const CINEMATIC_BEARING_LITE = 18;
/** Arc + speed for Mapbox flyTo — higher curve = more dramatic flight path */
export const FLY_CURVE = 1.68;
export const FLY_SPEED = 1.55;
export const FLY_DURATION_MS = 2400;
export const FLY_DURATION_OPEN_MS = 2000;
/** Altitude the open glide starts from. Zoomed in enough that the whole globe
 *  is never shown — the user opens on a calm regional view, not "the world". */
export const CINEMATIC_OPEN_ALTITUDE_ZOOM = 4.6;
/** Lite open starts closer — shorter dive, still airplane feel */
export const CINEMATIC_OPEN_ALTITUDE_ZOOM_LITE = 5.4;
/** Duration of the gentle settle-down onto the user's location on open. */
export const CINEMATIC_OPEN_GLIDE_MS = 2400;
export const CINEMATIC_OPEN_GLIDE_LITE_MS = 1600;
/** Fast snap when map opens — user expects immediate centering, not a 2s flight. */
export const OPEN_CENTER_MS = 380;
export const CINEMATIC_MAX_PITCH_MOBILE = 60;
export const CINEMATIC_MAX_PITCH_DESKTOP = 65;

/** Respect adaptive WebGL profile — legacy stays flat; lite/full get airplane pitch. */
export function cinematicPitchForViewport(): number {
  const profile = getMapWebGLProfile();
  if (profile.tier === 'legacy') return 0;
  if (profile.tier === 'lite') {
    return typeof window !== 'undefined' && window.innerWidth < 768
      ? CINEMATIC_PITCH_LITE_MOBILE
      : CINEMATIC_PITCH_LITE;
  }
  return typeof window !== 'undefined' && window.innerWidth < 768
    ? CINEMATIC_PITCH_MOBILE
    : CINEMATIC_PITCH;
}

export function cinematicBearingForViewport(): number {
  const profile = getMapWebGLProfile();
  if (profile.tier === 'legacy') return 0;
  if (profile.tier === 'lite') return CINEMATIC_BEARING_LITE;
  return CINEMATIC_BEARING;
}

export function cinematicMaxPitchForViewport(): number {
  const profile = getMapWebGLProfile();
  if (profile.tier === 'legacy') return 0;
  if (profile.tier === 'lite') return 60;
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
  // Caller should only invoke when getMapWebGLProfile().enableFog is true.
  // Extra Safari guard — fog + WebGL2 has blanked maps on iOS.
  try {
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) return;
    if (typeof map.setFog !== 'function') return;

    map.setFog({
      color: 'rgb(200, 220, 240)',
      'high-color': 'rgb(50, 120, 220)',
      'horizon-blend': 0.03,
      'space-color': 'rgb(220, 235, 250)',
      'star-intensity': 0.15,
    });
  } catch {
    /* weak GPUs may reject fog */
  }
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
    pitch: opts?.pitch ?? cinematicPitchForViewport(),
    bearing: opts?.bearing ?? cinematicBearingForViewport(),
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
  const profile = getMapWebGLProfile();
  const pitch = opts?.pitch ?? cinematicPitchForViewport();
  const bearing = opts?.bearing ?? cinematicBearingForViewport();

  // Proven-weak / legacy devices: skip dramatic altitude dive — flat snap
  if (profile.tier === 'legacy') {
    map.easeTo({
      center,
      zoom,
      pitch: 0,
      bearing: 0,
      duration: Math.min(opts?.duration ?? OPEN_CENTER_MS, 500),
      essential: true,
    });
    return;
  }

  const altitude =
    opts?.altitudeZoom
    ?? (profile.tier === 'lite' ? CINEMATIC_OPEN_ALTITUDE_ZOOM_LITE : CINEMATIC_OPEN_ALTITUDE_ZOOM);
  const duration =
    opts?.duration
    ?? (profile.tier === 'lite' ? CINEMATIC_OPEN_GLIDE_LITE_MS : CINEMATIC_OPEN_GLIDE_MS);

  map.jumpTo({
    center,
    zoom: altitude,
    pitch,
    bearing,
  });
  map.easeTo({
    center,
    zoom,
    pitch,
    bearing,
    duration,
    easing: easeInOutCubic,
    essential: true,
  });
}

type MapboxModule = typeof import('mapbox-gl').default;

/** Frame every pin plus the search hub so all listings are visible on open. */
export function fitMapToPins(
  map: MapboxMap,
  mapboxgl: MapboxModule,
  center: { lng: number; lat: number },
  pins: { lng: number; lat: number }[],
  opts?: { padding?: number; maxZoom?: number; duration?: number },
): boolean {
  const valid = pins.filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat));
  if (valid.length === 0) return false;

  const bounds = new mapboxgl.LngLatBounds();
  bounds.extend([center.lng, center.lat]);
  for (const pin of valid) bounds.extend([pin.lng, pin.lat]);

  map.fitBounds(bounds, {
    padding: opts?.padding ?? 80,
    maxZoom: opts?.maxZoom ?? 14.5,
    duration: opts?.duration ?? FLY_DURATION_OPEN_MS,
    pitch: cinematicPitchForViewport(),
    bearing: cinematicBearingForViewport(),
    essential: true,
  });
  return true;
}

/** Zoom step per double-tap — punchy on phones (small screens felt under-zoomed at 3.0). */
export function getDoubleTapZoomStep(): number {
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 8.0 : 4.0;
}
export const DOUBLE_TAP_MAX_ZOOM = 20;
const DOUBLE_TAP_ZOOM_MS = 380;

/** Quick ease-in at the tap point; repeat double-taps stack for gradual zoom. */
export function incrementalDoubleTapZoom(
  map: MapboxMap,
  center: [number, number],
): boolean {
  const current = map.getZoom();
  const next = Math.min(DOUBLE_TAP_MAX_ZOOM, current + getDoubleTapZoomStep());
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
