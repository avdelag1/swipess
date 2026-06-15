import type { Map as MapboxMap } from 'mapbox-gl';

/** Default "flying / plane" camera — pitched 3D view */
export const CINEMATIC_PITCH = 58;
export const CINEMATIC_BEARING = 22;

export function zoomForRadiusKm(km: number): number {
  // Mapbox zoom ≈ log2(circumference / radius_px). At equator,
  // zoom 14 ≈ 1km across screen. This tuned formula keeps the circle
  // visible but NOT covering the entire viewport.
  // 5km → ~13.3, 20km → ~11.3, 40km → ~10.3, 80km → ~9.3
  const z = 14.6 - Math.log2(Math.max(km, 3));
  return Math.min(15, Math.max(8.5, z));
}

export function applyCinematicFog(map: MapboxMap, isLight: boolean): void {
  map.setFog({
    color: isLight ? 'rgb(186, 210, 235)' : 'rgb(20, 20, 30)',
    'high-color': isLight ? 'rgb(36, 92, 223)' : 'rgb(10, 10, 15)',
    'horizon-blend': 0.02,
    'space-color': isLight ? 'rgb(240, 245, 250)' : 'rgb(5, 5, 10)',
    'star-intensity': isLight ? 0 : 0.6,
  });
}

export function addCinematic3DBuildings(map: MapboxMap, isLight: boolean): void {
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
      minzoom: 13,
      paint: {
        'fill-extrusion-color': isLight ? '#e5e7eb' : '#262626',
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          13, 0,
          13.05, ['get', 'height'],
        ],
        'fill-extrusion-base': [
          'interpolate', ['linear'], ['zoom'],
          13, 0,
          13.05, ['get', 'min_height'],
        ],
        'fill-extrusion-opacity': 0.65,
      },
    },
    labelLayerId,
  );
}

export function cinematicFlyTo(
  map: MapboxMap,
  center: [number, number],
  zoom: number,
  opts?: { duration?: number; bearing?: number; pitch?: number },
): void {
  map.flyTo({
    center,
    zoom,
    pitch: opts?.pitch ?? CINEMATIC_PITCH,
    bearing: opts?.bearing ?? CINEMATIC_BEARING,
    duration: opts?.duration ?? 1400,
    essential: true,
  });
}

export function cinematicEaseTo(
  map: MapboxMap,
  center: [number, number],
  zoom: number,
  opts?: { duration?: number; bearing?: number; pitch?: number },
): void {
  map.easeTo({
    center,
    zoom,
    pitch: opts?.pitch ?? CINEMATIC_PITCH,
    bearing: opts?.bearing ?? map.getBearing(),
    duration: opts?.duration ?? 400,
    essential: true,
  });
}