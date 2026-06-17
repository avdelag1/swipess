let loadPromise: Promise<void> | null = null;

/** Preload frequently opened modal chunks for snappier first open. */
export function prefetchCommonModalsModule(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = Promise.all([
    import('@/components/AdvancedFiltersDialog'),
    import('@/components/SwipeInsightsModal'),
    import('@/components/PropertyDetails'),
    import('@/components/SubscriptionPackages'),
    import('@/components/SavedSearchesDialog'),
  ])
    .then(() => {})
    .catch(() => {
      loadPromise = null;
    });

  return loadPromise;
}