// Same-origin worker URLs (Vite emits under /assets/…). Cross-origin
// `new Worker('https://api.mapbox.com/...')` is blocked from www.swipess.com.
// @ts-expect-error Vite ?url import
import mapboxCspWorkerUrl from 'mapbox-gl/dist/mapbox-gl-csp-worker.js?url';
// @ts-expect-error Vite ?url import
import mapboxLegacyCspWorkerUrl from 'mapbox-gl-legacy/dist/mapbox-gl-csp-worker.js?url';

import { getMapWebGLProfile } from '@/utils/mapWebGLProfile';

type MapboxGL = typeof import('mapbox-gl').default;
type MapboxGeocoder = typeof import('@mapbox/mapbox-gl-geocoder').default;

let warmPromise: Promise<{
  mapboxgl: MapboxGL;
  MapboxGeocoder: MapboxGeocoder;
  legacy: boolean;
}> | null = null;

function configureMapboxWorker(mapboxgl: MapboxGL, legacy: boolean): void {
  try {
    const url = legacy ? mapboxLegacyCspWorkerUrl : mapboxCspWorkerUrl;
    if (typeof url === 'string' && url.length > 0) {
      mapboxgl.workerUrl = url;
      return;
    }
  } catch { /* fall through */ }
  // Leave Mapbox defaults (blob worker). Never set api.mapbox.com workerUrl.
}

/**
 * Load Mapbox + Geocoder. On weak WebGL (Safari UBO=0, old iPhones) loads
 * mapbox-gl@2 (WebGL1) instead of v3 so the map still paints.
 * Chrome / strong GPUs keep the modern full package.
 */
export function warmMapboxModules(): Promise<{
  mapboxgl: MapboxGL;
  MapboxGeocoder: MapboxGeocoder;
  legacy: boolean;
}> {
  if (!warmPromise) {
    const profile = getMapWebGLProfile();
    const legacy = profile.useLegacyGl;

    warmPromise = (async () => {
      const mapboxModule = legacy
        ? await import('mapbox-gl-legacy')
        : await import('mapbox-gl');

      const [geocoderModule] = await Promise.all([
        import('@mapbox/mapbox-gl-geocoder'),
        legacy
          ? import('mapbox-gl-legacy/dist/mapbox-gl.css')
          : import('mapbox-gl/dist/mapbox-gl.css'),
        import('@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'),
      ]);

      const mapboxgl = (mapboxModule as { default: MapboxGL }).default;
      configureMapboxWorker(mapboxgl, legacy);
      return {
        mapboxgl,
        MapboxGeocoder: geocoderModule.default,
        legacy,
      };
    })();
  }
  return warmPromise;
}

export function isMapboxWarmed(): boolean {
  return warmPromise != null;
}

/** Drop warm cache so a recovery can re-pick tier after context loss. */
export function resetWarmMapboxModules(): void {
  warmPromise = null;
}
