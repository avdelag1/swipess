// Same-origin worker URL (Vite emits this under /assets/…). Cross-origin
// `new Worker('https://api.mapbox.com/...')` is blocked by browsers with:
// SecurityError: Script cannot be accessed from origin 'https://www.swipess.com'
// even when worker-src allows mapbox.com.
// @ts-expect-error Vite ?url import
import mapboxCspWorkerUrl from 'mapbox-gl/dist/mapbox-gl-csp-worker.js?url';

type MapboxGL = typeof import('mapbox-gl').default;
type MapboxGeocoder = typeof import('@mapbox/mapbox-gl-geocoder').default;

let warmPromise: Promise<{
  mapboxgl: MapboxGL;
  MapboxGeocoder: MapboxGeocoder;
}> | null = null;

function configureMapboxWorker(mapboxgl: MapboxGL): void {
  try {
    // Prefer bundled same-origin CSP worker (works on Chrome + Safari + Capacitor)
    if (typeof mapboxCspWorkerUrl === 'string' && mapboxCspWorkerUrl.length > 0) {
      mapboxgl.workerUrl = mapboxCspWorkerUrl;
      return;
    }
  } catch { /* fall through */ }

  // Last resort: leave Mapbox defaults (blob worker). Do NOT point workerUrl at
  // api.mapbox.com — that throws SecurityError from https://www.swipess.com.
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
