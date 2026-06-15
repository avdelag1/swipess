import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';

const SOURCE_ID = 'search-radius-area';
const FILL_ID = 'search-radius-fill';
const FILL_OUTER_ID = 'search-radius-fill-outer';
const LINE_ID = 'search-radius-line';
const GLOW_ID = 'search-radius-glow';
const CENTER_ID = 'search-radius-center';

/** Build a geodesic circle polygon (accurate km radius, FB-style). */
export function buildCirclePolygon(
  lng: number,
  lat: number,
  radiusKm: number,
  steps = 72,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const earthKm = 6371;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const d = radiusKm / earthKm;

  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(bearing),
    );
    const lng2 = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(latRad),
      Math.cos(d) - Math.sin(latRad) * Math.sin(lat2),
    );
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return {
    type: 'Feature',
    properties: { radiusKm },
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

export function syncRadiusCircleOnMap(
  map: MapboxMap,
  lng: number,
  lat: number,
  radiusKm: number,
  options?: { showCenterDot?: boolean },
): void {
  const showCenterDot = options?.showCenterDot ?? true;
  const polygon = buildCirclePolygon(lng, lat, radiusKm);
  const center: GeoJSON.Feature<GeoJSON.Point> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [lng, lat] },
  };

  const upsert = (id: string, data: GeoJSON.Feature) => {
    const src = map.getSource(id);
    if (src && 'setData' in src) {
      (src as GeoJSONSource).setData(data);
    }
  };

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, { type: 'geojson', data: polygon });

    // Outer fill — lighter, very low opacity for gradient-like effect
    map.addLayer({
      id: FILL_OUTER_ID,
      type: 'fill',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'fill-color': '#C4B5FD',
        'fill-opacity': 0.12,
      },
    });

    // Inner fill — purple core
    map.addLayer({
      id: FILL_ID,
      type: 'fill',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'fill-color': '#8B5CF6',
        'fill-opacity': 0.22,
      },
    });

    // Glowing pulse ring — pink, blurred
    map.addLayer({
      id: GLOW_ID,
      type: 'line',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'line-color': '#EC4899',
        'line-width': 6,
        'line-opacity': 0.45,
        'line-blur': 8,
      },
    });

    // Dashed animated border
    map.addLayer({
      id: LINE_ID,
      type: 'line',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'line-color': '#A855F7',
        'line-width': 2.5,
        'line-opacity': 0.9,
        'line-dasharray': [2, 4],
      },
    });
  } else {
    upsert(SOURCE_ID, polygon);
  }

  if (showCenterDot) {
    if (!map.getSource(CENTER_ID)) {
      map.addSource(CENTER_ID, { type: 'geojson', data: center });
      map.addLayer({
        id: CENTER_ID,
        type: 'circle',
        source: CENTER_ID,
        slot: 'top',
        paint: {
          'circle-radius': 8,
          'circle-color': '#3B82F6',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1,
          'circle-blur': 0.1,
        },
      });
    } else {
      upsert(CENTER_ID, center);
      if (!map.getLayer(CENTER_ID)) {
        map.addLayer({
          id: CENTER_ID,
          type: 'circle',
          source: CENTER_ID,
          paint: {
            'circle-radius': 8,
            'circle-color': '#3B82F6',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1,
            'circle-blur': 0.1,
          },
        });
      }
    }
  } else if (map.getLayer(CENTER_ID)) {
    map.removeLayer(CENTER_ID);
    if (map.getSource(CENTER_ID)) map.removeSource(CENTER_ID);
  }

  // Live radius label feel — pulse stroke on change (supports up to 200km)
  if (map.getLayer(LINE_ID)) {
    map.setPaintProperty(LINE_ID, 'line-width', 2.5 + Math.min(radiusKm / 50, 2));
    map.setPaintProperty(FILL_ID, 'fill-opacity', 0.10 + Math.min(radiusKm / 200, 0.08));
    map.setPaintProperty(FILL_OUTER_ID, 'fill-opacity', 0.05 + Math.min(radiusKm / 200, 0.06));
    map.setPaintProperty(GLOW_ID, 'line-opacity', 0.25 + Math.min(radiusKm / 200, 0.15));
  }
}

export const RADIUS_LAYER_IDS = [FILL_OUTER_ID, FILL_ID, GLOW_ID, LINE_ID, CENTER_ID] as const;