import { supabase } from '@/integrations/supabase/client';
import { resolveMapboxAccessToken } from '@/utils/mapboxConfig';
import { warmMapboxModules } from '@/utils/mapWarmPool';
import { prefetchCityPhotos } from '@/utils/prefetchCityPhotos';

/** Default listing cluster — matches PassportMapModal MAP_SEARCH_HUB (Tulum). */
const MAP_HUB_LAT = 20.2114;
const MAP_HUB_LNG = -87.4654;
const MAP_HUB_RADIUS_KM = 50;

let started = false;
let loadPromise: Promise<void> | null = null;
let dataPrefetchStarted = false;

function prefetchMapPinData(): void {
  if (dataPrefetchStarted || typeof window === 'undefined') return;
  dataPrefetchStarted = true;
  void Promise.all([
    supabase.rpc('get_passport_map_listings', {
      p_user_lat: MAP_HUB_LAT,
      p_user_lon: MAP_HUB_LNG,
      p_radius_km: MAP_HUB_RADIUS_KM,
      p_limit: 120,
    }),
    supabase.rpc('get_passport_map_profiles', {
      p_user_lat: MAP_HUB_LAT,
      p_user_lon: MAP_HUB_LNG,
      p_radius_km: MAP_HUB_RADIUS_KM,
      p_limit: 120,
    }),
  ]).catch(() => {});
}

/** Preload Mapbox + PassportMapModal so the live map opens on first tap. */
export function prefetchPassportMapModule(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  started = true;
  warmMapboxModules().catch(() => {});
  void resolveMapboxAccessToken();
  prefetchCityPhotos();
  prefetchMapPinData();
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
  prefetchMapPinData();
  if (!loadPromise) {
    loadPromise = import('@/components/PassportMapModal')
      .then(() => {})
      .catch(() => { loadPromise = null; });
  }
}

export function isPassportMapPrefetched(): boolean {
  return started;
}