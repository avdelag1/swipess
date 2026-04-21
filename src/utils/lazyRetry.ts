import { lazy, ComponentType } from 'react';

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
      await new Promise(r => setTimeout(r, 1000));
      
      try {
        return await componentImport();
      } catch (retryError) {
        // If we still fail, and we haven't reloaded yet, RELOAD.
        if (!pageHasAlreadyReloaded) {
          window.sessionStorage.setItem('page-reloaded-on-chunk-fail', 'true');
          console.error('[lazyWithRetry] Critical chunk error. Hard reloading page...', retryError);
          window.location.reload();
          return new Promise(() => {}); // Never resolve to prevent further rendering while reloading
        }
        
        console.error('[lazyWithRetry] FAILED AFTER RELOAD', retryError);
        throw retryError;
      }
    }
  });
}

