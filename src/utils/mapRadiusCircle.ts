import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';

const SOURCE_ID = 'search-radius-area';
const FILL_ID = 'search-radius-fill';
const LINE_ID = 'search-radius-line';
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
): void {
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
    map.addLayer({
      id: FILL_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': '#6366F1',
        'fill-opacity': 0.18,
      },
    });
    map.addLayer({
      id: LINE_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#A855F7',
        'line-width': 3,
        'line-opacity': 0.9,
      },
    });
  } else {
    upsert(SOURCE_ID, polygon);
  }

  if (!map.getSource(CENTER_ID)) {
    map.addSource(CENTER_ID, { type: 'geojson', data: center });
    map.addLayer({
      id: CENTER_ID,
      type: 'circle',
      source: CENTER_ID,
      paint: {
        'circle-radius': 7,
        'circle-color': '#3B82F6',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 1,
      },
    });
  } else {
    upsert(CENTER_ID, center);
  }

  // Live radius label feel — pulse stroke on change
  if (map.getLayer(LINE_ID)) {
    map.setPaintProperty(LINE_ID, 'line-width', 3 + Math.min(radiusKm / 50, 2));
    map.setPaintProperty(FILL_ID, 'fill-opacity', 0.12 + Math.min(radiusKm / 200, 0.1));
  }
}

export const RADIUS_LAYER_IDS = [FILL_ID, LINE_ID, CENTER_ID] as const;