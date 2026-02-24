// Cache management utilities for immediate updates
// Note: clearAllCaches is imported from useAutomaticUpdates for centralization

/**
 * Clear all browser caches (Cache API)
 * NOTE: This function is centralized in useAutomaticUpdates.tsx
 * Kept here for backward compatibility - imports from there
 */
export { clearAllCaches } from '@/hooks/useAutomaticUpdates';

/**
 * Clear all local storage data related to the app
 */
export function clearAppData(): void {
  try {
    // Clear app-specific localStorage items
    const keysToPreserve = ['sb-']; // Preserve auth tokens
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      const shouldPreserve = keysToPreserve.some(prefix => key.startsWith(prefix));
      if (!shouldPreserve) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage completely
    sessionStorage.clear();
    
    console.log('[CacheManager] App data cleared (auth preserved)');
  } catch (e) {
    console.error('[CacheManager] Failed to clear app data:', e);
  }
}

/**
 * Force reload the page with cache bypass
 */
export function forceReload(): void {
  clearAllCaches().then(() => {
    // Use cache-busting reload
    window.location.href = window.location.pathname + '?_t=' + Date.now();
  });
}

/**
 * Nuclear option: Clear everything and reload
 * Use when app is in a broken state
 */
export function nuclearReset(): void {
  console.log('[CacheManager] Nuclear reset initiated');
  
  // 1. Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
  }
  
  // 2. Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // 3. Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // 4. Clear IndexedDB
  if ('indexedDB' in window) {
    indexedDB.databases?.().then(dbs => {
      dbs.forEach(db => {
        if (db.name) indexedDB.deleteDatabase(db.name);
      });
    });
  }
  
  // 5. Force reload with cache bypass
  setTimeout(() => {
    window.location.href = window.location.origin + '?_reset=' + Date.now();
  }, 500);
}

/**
 * Check for updates via service worker
 */
export function checkForUpdates(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
  }
}

/**
 * Set up automatic update checking with configurable interval
 */
export function setupUpdateChecker(intervalMs = 60000): () => void {
  if ('serviceWorker' in navigator) {
    // Check for updates periodically (default: every 1 minute)
    const intervalId = setInterval(checkForUpdates, intervalMs);

    // Check immediately on focus
    const handleFocus = () => checkForUpdates();
    window.addEventListener('focus', handleFocus);

    // Check on network reconnection
    const handleOnline = () => {
      console.log('[CacheManager] Back online, checking for updates');
      checkForUpdates();
    };
    window.addEventListener('online', handleOnline);

    // Listen for SW update notifications
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('[CacheManager] New version available:', event.data.version);
        // Auto-reload to get the new version
        window.location.reload();
      }
      if (event.data?.type === 'FORCE_REFRESH') {
        console.log('[CacheManager] Force refresh requested');
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }

  return () => {};
}

/**
 * Force clear cache and update version marker
 */
export function forceClearVersion(): void {
  const currentVersion = Date.now().toString();
  localStorage.setItem('swipematch_last_clear', currentVersion);
  clearAllCaches();
}

/**
 * Get current app version from meta tag
 */
export function getCurrentVersion(): string | null {
  const metaTag = document.querySelector('meta[name="app-version"]');
  return metaTag ? metaTag.getAttribute('content') : null;
}

/**
 * Check if app version has changed and clear cache if needed
 */
export function checkAppVersion(): void {
  const currentVersion = getCurrentVersion();
  const storedVersion = localStorage.getItem('app_version');
  
  if (currentVersion && storedVersion && currentVersion !== storedVersion) {
    console.log('[CacheManager] Version mismatch detected:', storedVersion, '->', currentVersion);
    // Clear caches immediately
    clearAllCaches().then(() => {
      localStorage.setItem('app_version', currentVersion);
    });
  } else if (currentVersion && !storedVersion) {
    // First time visiting, store current version
    localStorage.setItem('app_version', currentVersion);
  }
}

/**
 * Force update check by comparing service worker version
 */
export function forceVersionCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.type === 'VERSION_INFO') {
          const swVersion = event.data.version;
          const storedVersion = localStorage.getItem('app_version');
          
          if (swVersion !== storedVersion) {
            console.log('[CacheManager] SW version mismatch, update available');
            resolve(true);
          } else {
            resolve(false);
          }
        }
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
      
      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000);
    } else {
      resolve(false);
    }
  });
}

/**
 * Request the SW to clear all caches
 */
export function requestSwCacheClear(): Promise<void> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.type === 'CACHES_CLEARED') {
          console.log('[CacheManager] SW confirmed caches cleared');
          resolve();
        }
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_ALL_CACHES' },
        [messageChannel.port2]
      );
      
      // Timeout after 5 seconds
      setTimeout(resolve, 5000);
    } else {
      resolve();
    }
  });
}