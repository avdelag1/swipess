import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';

const GPS_SOURCE_ID = 'user-gps-location';
const GPS_PULSE_ID = 'user-gps-pulse';
const GPS_DOT_ID = 'user-gps-dot';
const GPS_RING_ID = 'user-gps-ring';

/** Prominent "you are here" marker — separate from the search-radius center. */
export function syncUserGpsDotOnMap(
  map: MapboxMap,
  lng: number,
  lat: number,
): void {
  const point: GeoJSON.Feature<GeoJSON.Point> = {
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

  if (!map.getSource(GPS_SOURCE_ID)) {
    map.addSource(GPS_SOURCE_ID, { type: 'geojson', data: point });

    map.addLayer({
      id: GPS_PULSE_ID,
      type: 'circle',
      source: GPS_SOURCE_ID,
      slot: 'top',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 12, 14, 18, 16, 24],
        'circle-color': '#10B981',
        'circle-opacity': 0.28,
        'circle-blur': 0.35,
      },
    });

    map.addLayer({
      id: GPS_RING_ID,
      type: 'circle',
      source: GPS_SOURCE_ID,
      slot: 'top',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 8, 14, 12, 16, 16],
        'circle-color': '#10B981',
        'circle-opacity': 0.45,
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 1,
      },
    });

    map.addLayer({
      id: GPS_DOT_ID,
      type: 'circle',
      source: GPS_SOURCE_ID,
      slot: 'top',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 6, 16, 8],
        'circle-color': '#10B981',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 1,
      },
    });
  } else {
    upsert(GPS_SOURCE_ID, point);
  }
}

export function removeUserGpsDotFromMap(map: MapboxMap): void {
  for (const id of [GPS_DOT_ID, GPS_RING_ID, GPS_PULSE_ID]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(GPS_SOURCE_ID)) map.removeSource(GPS_SOURCE_ID);
}

export const GPS_LAYER_IDS = [GPS_PULSE_ID, GPS_RING_ID, GPS_DOT_ID] as const;