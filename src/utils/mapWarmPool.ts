type MapboxGL = typeof import('mapbox-gl').default;
type MapboxGeocoder = typeof import('@mapbox/mapbox-gl-geocoder').default;

let warmPromise: Promise<{
  mapboxgl: MapboxGL;
  MapboxGeocoder: MapboxGeocoder;
}> | null = null;

/** Eagerly load Mapbox JS + CSS. Safe to call multiple times. */
export function warmMapboxModules(): Promise<{
  mapboxgl: MapboxGL;
  MapboxGeocoder: MapboxGeocoder;
}> {
  if (!warmPromise) {
    warmPromise = Promise.all([
      import('mapbox-gl'),
      import('@mapbox/mapbox-gl-geocoder'),
      import('mapbox-gl/dist/mapbox-gl.css'),
      import('@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'),
    ]).then(([mapboxModule, geocoderModule]) => ({
      mapboxgl: mapboxModule.default,
      MapboxGeocoder: geocoderModule.default,
    }));
  }
  return warmPromise;
}

export function isMapboxWarmed(): boolean {
  return warmPromise != null;
}