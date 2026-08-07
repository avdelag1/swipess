import { logger } from '@/utils/prodLogger';
import { ComponentType, lazy } from 'react';

const RELOAD_KEY = 'swipess_chunk_reload_once';

/**
 * Lazy load with one network retry. Avoids hard-reload loops in Chrome:
 * previously every failed chunk after deploy could `location.replace` every
 * 15s forever (localStorage throttle), fighting the service worker.
 *
 * At most ONE full reload per browser session. After that, surface the error
 * to ChunkErrorBoundary / ErrorBoundary for a manual recovery UI.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (firstError) {
      logger.warn('[lazyWithRetry] First load failed, retrying…', firstError);

      // Brief pause so a mid-deploy CDN race can settle
      await new Promise((r) => setTimeout(r, 400));

      try {
        return await componentImport();
      } catch (retryError) {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1';
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_KEY, '1');
          logger.error('[lazyWithRetry] Chunk failed twice — one-time hard reload', retryError);

          try {
            if ('caches' in window) {
              const names = await caches.keys();
              await Promise.all(names.map((n) => caches.delete(n)));
            }
          } catch { /* empty */ }

          const params = new URLSearchParams(window.location.search);
          params.set('v', String(Date.now()));
          window.location.replace(window.location.pathname + '?' + params.toString());
          return new Promise(() => {}); // hang while navigating
        }

        logger.error('[lazyWithRetry] FAILED after one-session reload — giving up', retryError);
        throw retryError;
      }
    }
  });
}
