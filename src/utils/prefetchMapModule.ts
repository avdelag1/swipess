import { resolveMapboxAccessToken } from '@/utils/mapboxConfig';
import { warmMapboxModules } from '@/utils/mapWarmPool';

let started = false;

/** Preload Mapbox + PassportMapModal so the live map opens on first tap. */
export function prefetchPassportMapModule(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  warmMapboxModules().catch(() => {});
  void resolveMapboxAccessToken();
  import('@/components/PassportMapModal').catch(() => {});
}

/** Aggressive warm — call on swipe deck mount. */
export function prefetchPassportMapImmediate(): void {
  if (typeof window === 'undefined') return;
  started = true;
  warmMapboxModules().catch(() => {});
  void resolveMapboxAccessToken();
}