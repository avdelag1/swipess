import { resolveMapboxAccessToken } from '@/utils/mapboxConfig';
import { warmMapboxModules } from '@/utils/mapWarmPool';
import { prefetchCityPhotos } from '@/utils/prefetchCityPhotos';

let started = false;
let loadPromise: Promise<void> | null = null;

/** Preload Mapbox + PassportMapModal so the live map opens on first tap. */
export function prefetchPassportMapModule(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  started = true;
  warmMapboxModules().catch(() => {});
  void resolveMapboxAccessToken();
  prefetchCityPhotos();
  loadPromise = import('@/components/PassportMapModal')
    .then(() => {})
    .catch(() => {
      loadPromise = null;
    });
  return loadPromise;
}

/** Aggressive warm — call on swipe deck mount / map button press. */
export function prefetchPassportMapImmediate(): void {
  if (typeof window === 'undefined') return;
  started = true;
  warmMapboxModules().catch(() => {});
  void resolveMapboxAccessToken();
  prefetchCityPhotos();
  if (!loadPromise) {
    loadPromise = import('@/components/PassportMapModal')
      .then(() => {})
      .catch(() => { loadPromise = null; });
  }
}

export function isPassportMapPrefetched(): boolean {
  return started;
}