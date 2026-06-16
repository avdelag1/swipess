let loadPromise: Promise<void> | null = null;
let started = false;

/** Preload AI listing/profile wizard chunks for instant open. */
export function prefetchAIWizardsModule(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  started = true;
  loadPromise = Promise.all([
    import('@/components/AIListingWizard'),
    import('@/components/AIProfileWizard'),
  ])
    .then(() => {})
    .catch(() => {
      loadPromise = null;
    });

  return loadPromise;
}

export function isAIWizardsPrefetched(): boolean {
  return started;
}