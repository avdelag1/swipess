let started = false;
let loadPromise: Promise<void> | null = null;

/** Preload ConciergeChat chunk so the AI bot opens instantly on first tap. */
export function prefetchConciergeChatModule(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  started = true;
  loadPromise = import('@/components/ConciergeChat')
    .then(() => {})
    .catch(() => {
      loadPromise = null;
    });

  return loadPromise;
}

/** Returns true once the ConciergeChat chunk has been requested. */
export function isConciergeChatPrefetched(): boolean {
  return started;
}