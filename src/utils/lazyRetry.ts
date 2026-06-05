import { ComponentType, lazy } from 'react';

/**
 * Lazy load with a single network retry (no page reload).
 * If both attempts fail, the error surfaces to the nearest ErrorBoundary.
 */
/**
 * Lazy load with a single network retry and if that fails, trigger a hard page reload.
 * This effectively handles Vite "chunk load failures" after a production re-deploy.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasAlreadyReloaded = window.sessionStorage.getItem('page-reloaded-on-chunk-fail');

    try {
      return await componentImport();
    } catch (firstError) {
      console.warn('[lazyWithRetry] First load failed, retrying…', firstError);
      
      // Delay before first retry
      
      try {
        return await componentImport();
      } catch (retryError) {
        // If we still fail, and we haven't reloaded yet, RELOAD.
        if (!pageHasAlreadyReloaded) {
          window.sessionStorage.setItem('page-reloaded-on-chunk-fail', 'true');
          console.error('[lazyWithRetry] Critical chunk error. Hard reloading page...', retryError);
          // Clear SW caches so reload gets fresh chunks
          if ('caches' in window) {
            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).catch(() => {});
          }
          window.location.replace(window.location.pathname + '?v=' + Date.now());
          return new Promise(() => {}); // Never resolve to prevent further rendering while reloading
        }
        
        console.error('[lazyWithRetry] FAILED AFTER RELOAD', retryError);
        throw retryError;
      }
    }
  });
}


