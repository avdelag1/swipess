/** Preload Mapbox + PassportMapModal chunks so the live map opens instantly. */
let mapPrefetchStarted = false;

export function prefetchPassportMapModule(): void {
  if (mapPrefetchStarted || typeof window === 'undefined') return;
  mapPrefetchStarted = true;

  const run = () => {
    import('mapbox-gl').catch(() => {});
    import('@/components/PassportMapModal').catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 400);
  }
}