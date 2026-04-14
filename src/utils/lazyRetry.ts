import { lazy, ComponentType } from 'react';

/**
 * Lazy load with a single network retry (no page reload).
 * If both attempts fail, the error surfaces to the nearest ErrorBoundary.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (firstError) {
      // One retry after a short delay (cache-bust via fresh import call)
      console.warn('[lazyWithRetry] First load failed, retrying…', firstError);
      await new Promise(r => setTimeout(r, 1500));
      try {
        return await componentImport();
      } catch (retryError) {
        console.error('[lazyWithRetry] Retry also failed', retryError);
        throw retryError; // Let ErrorBoundary handle it — NO reload
      }
    }
  });
}
