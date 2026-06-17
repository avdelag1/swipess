let loadPromise: Promise<void> | null = null;

/** Preload listing upload flow chunks for instant modal open. */
export function prefetchListingFlowModule(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = Promise.all([
    import('@/components/CategorySelectionDialog'),
    import('@/components/UnifiedListingForm'),
    import('@/components/AIListingWizard'),
    import('@/pages/OwnerNewListing'),
  ])
    .then(() => {})
    .catch(() => {
      loadPromise = null;
    });

  return loadPromise;
}