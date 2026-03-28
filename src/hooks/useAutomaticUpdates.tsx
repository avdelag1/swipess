/**
 * Automatic App Update System
 *
 * This module handles automatic app updates when new versions are deployed.
 * It uses the Service Worker API to detect updates and force-refresh the app.
 *
 * Features:
 * - Automatic update detection on app load using BUILD_TIMESTAMP
 * - User notification when update is available
 * - One-click update with automatic cache clearing
 * - Version tracking to prevent unnecessary updates
 * - React Query cache invalidation
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/prodLogger';

// Get build timestamp from Vite injected environment variable
// This changes EVERY deployment, ensuring all users get updates
const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIME || Date.now().toString();

// Current app version - derived from build timestamp for automatic updates
export const APP_VERSION = `1.0.${BUILD_TIMESTAMP.slice(-6)}`;

// Storage key for version tracking
const VERSION_STORAGE_KEY = 'Swipess_app_version';
const _SW_REGISTRATION_KEY = 'Swipess_sw_registration';

interface UpdateInfo {
  available: boolean;
  version?: string;
  needsRefresh: boolean;
}

/**
 * Check if a new version is available
 * Returns true if the stored version differs from current (build timestamp based)
 */
export function checkForUpdates(): UpdateInfo {
  if (typeof window === 'undefined') {
    return { available: false, needsRefresh: false };
  }

  // In dev mode, BUILD_TIMESTAMP is Date.now() on every load — always different.
  // Suppress update notifications entirely so they don't block the preview.
  if (import.meta.env.DEV) {
    markVersionAsInstalled();
    return { available: false, needsRefresh: false };
  }

  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

  // First visit or version changed (always true on new deployment)
  if (!storedVersion || storedVersion !== BUILD_TIMESTAMP) {
    return {
      available: true,
      version: APP_VERSION,
      needsRefresh: true,
    };
  }

  return { available: false, needsRefresh: false };
}

/**
 * Mark the current version as installed
 * Stores the BUILD_TIMESTAMP so future deployments will detect changes
 */
export function markVersionAsInstalled(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VERSION_STORAGE_KEY, BUILD_TIMESTAMP);
  }
}

/**
 * Clear all browser caches
 */
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
}

/**
 * Unregister existing service workers
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
  }
}

/**
 * Force a full app refresh by clearing caches and reloading
 */
export async function forceAppUpdate(): Promise<void> {
  try {
    // Show updating toast
    toast({
      title: 'Updating App...',
      description: 'Clearing cache and getting the latest version.',
      duration: 3000,
    });

    // Unregister service workers
    await unregisterServiceWorkers();

    // Clear all caches
    await clearAllCaches();

    // Update stored version
    markVersionAsInstalled();

    // Small delay before reload
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reload the page
    window.location.reload();
  } catch (error) {
    logger.error('Failed to update app:', error);
    toast({
      title: 'Update Failed',
      description: 'Please try clearing your browser cache manually.',
      variant: 'destructive',
    });
  }
}

/**
 * React hook for automatic update checking
 */
export function useAutomaticUpdates() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ available: false, needsRefresh: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const checkUpdates = useCallback(async () => {
    const info = checkForUpdates();
    
    // Only update state if info actually changed to prevent unnecessary re-renders
    setUpdateInfo(prev => {
      if (prev.available === info.available && prev.version === info.version) {
        return prev;
      }
      return info;
    });

    // CRITICAL: Removed queryClient.clear() from here. 
    // It should only be called in performUpdate or when we are absolutely certain
    // we want to wipe everything. Calling it on every periodic check (even if update available)
    // can trigger global re-render loops in some app configurations.
  }, []); // Remove queryClient dependency as we use the one from scope or ref if needed

  const performUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      logger.info('[AutoUpdate] Performing manual update...');
      
      // Clear React Query cache
      queryClient.clear();

      // Unregister service workers
      await unregisterServiceWorkers();

      // Clear all caches
      await clearAllCaches();

      // Update version
      markVersionAsInstalled();

      // Reload
      window.location.reload();
    } catch (error) {
      logger.error('Update failed:', error);
      setIsUpdating(false);
      toast({
        title: 'Update Failed',
        description: 'Please refresh the page or clear your browser cache.',
        variant: 'destructive',
      });
    }
  }, [isUpdating, queryClient]);

  useEffect(() => {
    // Only run the initial check once on mount
    checkUpdates();

    // Also check when app gains focus (user returns to tab)
    const handleFocus = () => {
      // Don't check if we're already in the middle of an update
      if (!isUpdating) checkUpdates();
    };
    window.addEventListener('focus', handleFocus);

    // Listen for service worker updates
    let swSubscription: { registration: ServiceWorkerRegistration, handleUpdateFound: () => void } | null = null;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const handleUpdateFound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateInfo({
                  available: true,
                  version: APP_VERSION,
                  needsRefresh: true,
                });
              }
            });
          }
        };
        registration.addEventListener('updatefound', handleUpdateFound);
        swSubscription = { registration, handleUpdateFound };
      });
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (swSubscription) {
        swSubscription.registration.removeEventListener('updatefound', swSubscription.handleUpdateFound);
      }
    };
  }, [checkUpdates, isUpdating]); // performUpdate removed from deps as it's not used in effect

  return {
    updateInfo,
    isUpdating,
    checkUpdates,
    performUpdate,
  };
}

/**
 * Component that shows update notification when available
 */
export function UpdateNotification() {
  const { updateInfo, performUpdate, isUpdating } = useAutomaticUpdates();
  const [dismissed, setDismissed] = useState(false);
  const isVisible = updateInfo.available && !dismissed;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="update-notification"
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }}
          className="fixed bottom-24 left-4 right-4 z-[200] sm:left-auto sm:right-4 sm:w-[320px]"
        >
          <div className="relative overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(249,115,22,0.15)]">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />


            <div className="flex items-center gap-3 px-4 pt-5 pb-4">
              {/* Sentient Mascot Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                <img src="/icons/fire-s-logo-zoom.png" className="w-8 h-8 object-contain" alt="Update" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-5">
                <p className="text-white font-bold text-[14px] leading-tight">Update Ready</p>
                <p className="text-white/45 text-[12px] mt-0.5 leading-snug">New features are available</p>
              </div>
            </div>

            {/* Refresh button */}
            <div className="px-4 pb-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={performUpdate}
                disabled={isUpdating}
                className="w-full py-4 rounded-xl bg-white text-black font-black text-[14px] uppercase tracking-[0.1em] shadow-[0_20px_40px_rgba(255,255,255,0.15)] disabled:opacity-60 transition-all border-none"
              >
                {isUpdating ? 'Pulsing Version...' : 'Refresh App Now'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Check the HTML meta tag version against the running JS BUILD_TIMESTAMP.
 * The HTML is always fresh (served with no-cache headers), but the JS may be
 * stale due to service worker stale-while-revalidate caching.
 * If they differ, the running JS is outdated — force a full cache clear + reload.
 */
function checkHtmlVersionMismatch(): boolean {
  try {
    const metaTag = document.querySelector('meta[name="app-version"]');
    if (!metaTag) return false;
    const htmlVersion = metaTag.getAttribute('content');
    if (!htmlVersion) return false;
    // The HTML version is the build timestamp injected by vite.config.ts.
    // If it doesn't match the JS BUILD_TIMESTAMP, the SW served stale JS.
    return htmlVersion !== BUILD_TIMESTAMP;
  } catch {
    return false;
  }
}

/**
 * Force update on app mount - use when you want guaranteed updates
 * This clears all caches and reloads if version changed (based on BUILD_TIMESTAMP)
 * Also detects stale JS served by service worker via HTML meta tag comparison.
 */
export function useForceUpdateOnVersionChange() {
  useEffect(() => {
    // In dev mode, skip forced updates — version changes every load
    if (import.meta.env.DEV) {
      markVersionAsInstalled();
      return;
    }

    // GUARD 1: Session-level cooldown — only trigger one reload per session
    const alreadyReloaded = sessionStorage.getItem('swipes_reload_triggered');
    if (alreadyReloaded) return;

    // GUARD 2: Minimum time on page — don't reload within the first 30s of a fresh load
    // This prevents the infinite reload loop on initial page visits
    const pageLoadTime = performance.now();
    if (pageLoadTime < 30000) {
      // Only silently mark the version as installed on fresh load
      // and skip the forced update — user just arrived
      const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      if (!storedVersion) {
        markVersionAsInstalled();
      }

      // Schedule a deferred check after the user has been on the page for 30s
      const timer = setTimeout(() => {
        const stillMismatch = checkHtmlVersionMismatch();
        const versionChanged = localStorage.getItem(VERSION_STORAGE_KEY) !== BUILD_TIMESTAMP;
        if (stillMismatch || versionChanged) {
          sessionStorage.setItem('swipes_reload_triggered', '1');
          forceAppUpdate();
        } else {
          markVersionAsInstalled();
        }
      }, 30000);

      return () => clearTimeout(timer);
    }

    // If already been on page 30s+ (e.g. focus regain), do the normal check
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    if (storedVersion && storedVersion !== BUILD_TIMESTAMP) {
      sessionStorage.setItem('swipes_reload_triggered', '1');
      forceAppUpdate();
      return;
    }

    if (checkHtmlVersionMismatch()) {
      if (import.meta.env.DEV) 
      sessionStorage.setItem('swipes_reload_triggered', '1');
      forceAppUpdate();
      return;
    }

    markVersionAsInstalled();
  }, []);
}

/**
 * Version info display component
 */
export function VersionInfo({ showDetails = false }: { showDetails?: boolean }) {
  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
  const hasUpdate = storedVersion && storedVersion !== BUILD_TIMESTAMP;

  return (
    <div className="text-xs text-gray-500">
      {showDetails && (
        <div className="flex gap-2">
          <span>App: v{APP_VERSION}</span>
          <span className="text-gray-400">({BUILD_TIMESTAMP})</span>
          {hasUpdate && (
            <span className="text-orange-500 font-bold">(Update available!)</span>
          )}
        </div>
      )}
    </div>
  );
}

export default {
  APP_VERSION,
  checkForUpdates,
  markVersionAsInstalled,
  clearAllCaches,
  unregisterServiceWorkers,
  forceAppUpdate,
  useAutomaticUpdates,
  useForceUpdateOnVersionChange,
  UpdateNotification,
  VersionInfo,
};
