import { logger } from '@/utils/prodLogger';
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
    try {
      return await componentImport();
    } catch (firstError) {
      logger.warn('[lazyWithRetry] First load failed, retrying…', firstError);
      
      try {
        return await componentImport();
      } catch (retryError) {
        // Use a timestamp in localStorage to prevent infinite reload loops
        // Safari can sometimes lose sessionStorage across window.location.replace, causing loops
        const lastReloadStr = window.localStorage.getItem('last-chunk-reload-time');
        const lastReload = lastReloadStr ? parseInt(lastReloadStr, 10) : 0;
        const now = Date.now();
        
        // If we haven't reloaded in the last 15 seconds, trigger a hard reload
        if (now - lastReload > 15000) {
          window.localStorage.setItem('last-chunk-reload-time', String(now));
          console.error('[lazyWithRetry] Critical chunk error. Hard reloading page...', retryError);
          
          // Clear SW caches so reload gets fresh chunks
          if ('caches' in window) {
            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).catch(() => {});
          }
          
          // Preserve existing query params
          const params = new URLSearchParams(window.location.search);
          params.set('v', String(now));
          window.location.replace(window.location.pathname + '?' + params.toString());
          
          return new Promise(() => {}); // Never resolve to prevent further rendering while reloading
        }
        
        console.error('[lazyWithRetry] FAILED AFTER RELOAD', retryError);
        throw retryError;
      }
    }
  });
}


