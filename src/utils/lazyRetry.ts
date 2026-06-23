import { logger } from '@/utils/prodLogger';
import { ComponentType, lazy } from 'react';
import {
  canAttemptRecoveryReload,
  clearStaleRuntimeCaches,
  reloadForFreshBuild,
} from '@/utils/chunkRecovery';

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
        // Stale chunk after a redeploy: a single cache-busting reload pulls the
        // fresh build. The gate is TIME-WINDOWED (see chunkRecovery) — not a
        // one-shot session flag — so a long session that spans several deploys
        // recovers from each new stale-shell episode instead of being disabled
        // forever after the first reload. Once the budget is spent the error
        // surfaces to the nearest ErrorBoundary instead of looping.
        if (canAttemptRecoveryReload()) {
          console.error('[lazyWithRetry] Critical chunk error. Hard reloading page...', retryError);
          // Drop the SW + caches so the reload can't be handed the same stale
          // shell again; race a timeout so a hung cache API can't strand us.
          await Promise.race([
            clearStaleRuntimeCaches(),
            new Promise<void>((resolve) => setTimeout(resolve, 2000)),
          ]);
          reloadForFreshBuild();
          return new Promise(() => {}); // Never resolve — the page is reloading
        }

        console.error('[lazyWithRetry] FAILED AFTER RELOAD', retryError);
        throw retryError;
      }
    }
  });
}


