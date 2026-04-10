import { lazy, ComponentType } from 'react';

/**
 * 🏎️ SPEED OF LIGHT: LAZY WITH AUTO-RETRY
 * 
 * When a PWA is updated (like after a git push), old chunk hashes are purged from the server.
 * If a user's browser is still running an old 'manifest.js', it will try to fetch the old hashes and 404.
 * 
 * This utility catches the 'Failed to fetch dynamically imported module' error and triggers
 * a hard reload to force the browser to pick up the new chunk manifest.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error: any) {
      if (!pageHasBeenForceRefreshed) {
        window.localStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        // Return a never-resolving promise as recovery - the page will reload anyway
        return new Promise(() => {}) as any;
      }
      throw error;
    }
  });
}
