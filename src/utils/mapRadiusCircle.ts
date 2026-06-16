import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';

const SOURCE_ID = 'search-radius-area';
const FILL_ID = 'search-radius-fill';
const FILL_OUTER_ID = 'search-radius-fill-outer';
const LINE_ID = 'search-radius-line';
const GLOW_ID = 'search-radius-glow';
const GLOW_OUTER_ID = 'search-radius-glow-outer';
const CENTER_ID = 'search-radius-center';

/** Brand cyan used across map HUD + radius UI */
const RADIUS_CYAN = '#00C6FF';
const RADIUS_BLUE = '#0072FF';

/** Build a geodesic circle polygon (accurate km radius). */
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

    // Wide soft halo — glass radar wash (very transparent)
    map.addLayer({
      id: FILL_OUTER_ID,
      type: 'fill',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'fill-color': RADIUS_CYAN,
        'fill-opacity': 0.04,
      },
    });

    // Inner tint — subtle cyan core, still see-through
    map.addLayer({
      id: FILL_ID,
      type: 'fill',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'fill-color': RADIUS_BLUE,
        'fill-opacity': 0.07,
      },
    });

    // Outer bloom ring
    map.addLayer({
      id: GLOW_OUTER_ID,
      type: 'line',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'line-color': RADIUS_CYAN,
        'line-width': 10,
        'line-opacity': 0.18,
        'line-blur': 10,
      },
    });

    // Crisp glowing edge
    map.addLayer({
      id: GLOW_ID,
      type: 'line',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'line-color': RADIUS_CYAN,
        'line-width': 4,
        'line-opacity': 0.42,
        'line-blur': 3,
      },
    });

    // Sharp white-cyan rim — defines the search boundary
    map.addLayer({
      id: LINE_ID,
      type: 'line',
      source: SOURCE_ID,
      slot: 'top',
      paint: {
        'line-color': '#E0F7FF',
        'line-width': 1.75,
        'line-opacity': 0.72,
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
          'circle-radius': 7,
          'circle-color': '#EF4444', // Red center dot per Dribbble design
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1,
          'circle-stroke-opacity': 1,
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
            'circle-radius': 7,
            'circle-color': '#EF4444', // Red center dot per Dribbble design
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1,
            'circle-stroke-opacity': 1,
          },
        });
      }
    }
  } else if (map.getLayer(CENTER_ID)) {
    map.removeLayer(CENTER_ID);
    if (map.getSource(CENTER_ID)) map.removeSource(CENTER_ID);
  }

  // Subtle pulse as radius changes — stays glassy at all sizes
  const sizeFactor = Math.min(radiusKm / 80, 1);
  if (map.getLayer(LINE_ID)) {
    map.setPaintProperty(LINE_ID, 'line-width', 1.5 + sizeFactor * 0.75);
    map.setPaintProperty(FILL_ID, 'fill-opacity', 0.05 + sizeFactor * 0.04);
    map.setPaintProperty(FILL_OUTER_ID, 'fill-opacity', 0.03 + sizeFactor * 0.03);
    map.setPaintProperty(GLOW_ID, 'line-opacity', 0.32 + sizeFactor * 0.12);
    map.setPaintProperty(GLOW_OUTER_ID, 'line-opacity', 0.12 + sizeFactor * 0.08);
  }
}

export const RADIUS_LAYER_IDS = [
  FILL_OUTER_ID,
  FILL_ID,
  GLOW_OUTER_ID,
  GLOW_ID,
  LINE_ID,
  CENTER_ID,
] as const;