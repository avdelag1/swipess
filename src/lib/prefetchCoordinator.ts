/** Shared dedupe set so multiple usePrefetchManager instances don't double-fetch. */
const prefetchedKeys = new Set<string>();

export function shouldPrefetch(key: string): boolean {
  if (prefetchedKeys.has(key)) return false;
  prefetchedKeys.add(key);
  return true;
}

export function clearPrefetchCoordinator(): void {
  prefetchedKeys.clear();
}