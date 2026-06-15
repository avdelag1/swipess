type MapboxGL = typeof import('mapbox-gl').default;
type MapboxGeocoder = typeof import('@mapbox/mapbox-gl-geocoder').default;

let warmPromise: Promise<{
  mapboxgl: MapboxGL;
  MapboxGeocoder: MapboxGeocoder;
}> | null = null;

function configureMapboxWorker(mapboxgl: MapboxGL): void {
  // Vite code-splits mapbox into vendor-maps — blob workers can fail on some mobile
  // browsers after deploy. CDN worker is reliable and allowed by our CSP.
  if (!mapboxgl.workerUrl) {
    mapboxgl.workerUrl = `https://api.mapbox.com/mapbox-gl-js/v${mapboxgl.version}/mapbox-gl-csp-worker.js`;
  }
}

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
    ]).then(([mapboxModule, geocoderModule]) => {
      const mapboxgl = mapboxModule.default;
      configureMapboxWorker(mapboxgl);
      return {
        mapboxgl,
        MapboxGeocoder: geocoderModule.default,
      };
    });
  }
  return warmPromise;
}

export function isMapboxWarmed(): boolean {
  return warmPromise != null;
}