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
const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIME || 'v1.0.0';

// Current app version
export const APP_VERSION = `1.0.${BUILD_TIMESTAMP === 'v1.0.0' ? '999' : BUILD_TIMESTAMP.slice(-8)}`;

// Storage key for version tracking
const VERSION_STORAGE_KEY = 'Swipess_app_version';
const RELOAD_GUARD_KEY = 'Swipess_reload_triggered';
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

    // Session-level guard: track reload attempt to prevent infinite loops
    const reloadCount = parseInt(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0', 10);
    if (reloadCount >= 2) {
      logger.warn('[AutoUpdate] Max reload attempts reached. Skipping force reload.');
      return;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, (reloadCount + 1).toString());

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
/**
 * React hook for automatic update checking
 */
export function useAutomaticUpdates() {
  const [updateInfo, _setUpdateInfo] = useState<UpdateInfo>({ available: false, needsRefresh: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
 
  const performUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    // GUARD: Check if we've already reloaded multiple times in this session
    const reloadCount = parseInt(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0', 10);
    if (reloadCount >= 2) {
      logger.warn('[AutoUpdate] Session reload cap reached. Blocking automatic reload.');
      return;
    }

    setIsUpdating(true);
    // Mark as seen in session immediately
    sessionStorage.setItem('Swipess_update_seen', 'true');
    sessionStorage.setItem(RELOAD_GUARD_KEY, (reloadCount + 1).toString());

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

      // Reload with delay for visual feedback
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      logger.error('Update failed:', error);
      setIsUpdating(false);
      window.location.reload();
    }
  }, [isUpdating, queryClient]);

  const checkUpdates = useCallback(async () => {
    const info = checkForUpdates();
    if (info.available) {
      performUpdate();
    }
  }, [performUpdate]);


  useEffect(() => {
    // Only run the initial check once on mount
    checkUpdates();

    // Also check when app gains focus
    const handleFocus = () => {
      if (!isUpdating) checkUpdates();
    };
    window.addEventListener('focus', handleFocus);

    // Filter service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (sessionStorage.getItem('Swipess_update_seen') !== 'true') {
                  performUpdate();
                }
              }
            });
          }
        });
      });
    }

    return () => window.removeEventListener('focus', handleFocus);
  }, [checkUpdates, isUpdating]);

  return {
    updateInfo,
    isUpdating,
    checkUpdates,
    performUpdate,
  };
}

/**
 * Component that shows update notification when available
 * UPGRADED: Liquid Glass Design with Swipess Rose highlights
 */
export function UpdateNotification() {
  const { updateInfo, performUpdate, isUpdating } = useAutomaticUpdates();
  const [dismissed, setDismissed] = useState(false);
  const isVisible = updateInfo.available && !dismissed;

  const handleUpdateClick = useCallback(async () => {
    // Immediate local dismissal and session suppression
    setDismissed(true);
    sessionStorage.setItem('Swipess_update_seen', 'true');
    await performUpdate();
  }, [performUpdate]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="update-notification"
          initial={{ y: -100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
          className="fixed top-24 left-4 right-4 z-[999] sm:left-6 sm:right-auto sm:w-[340px]"
        >
          {/* Main Glass Container */}
          <div 
             className="relative overflow-hidden rounded-[2.2rem] border p-[1px] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
             style={{
               background: 'rgba(8, 8, 10, 0.85)',
               borderColor: 'rgba(255,255,255,0.08)',
               backdropFilter: 'blur(40px) saturate(200%)',
               WebkitBackdropFilter: 'blur(40px) saturate(200%)',
             }}
          >
            {/* Animated Inner Glow Overlay */}
            <motion.div 
               className="absolute -inset-[50%] bg-gradient-to-br from-rose-500/15 via-orange-500/10 to-transparent pointer-none blur-[40px]"
               animate={{ rotate: 360 }}
               transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 p-6">
              <div className="flex items-center gap-4 mb-5">
                {/* Logo Frame — Deep Glass */}
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/10" />
                  <img src="/icons/icon-96.png" className="w-9 h-9 object-contain relative z-10" alt="S" />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-lg tracking-tight leading-tight uppercase italic italic-brand">
                    New Swipess Update
                  </p>
                  <p className="text-white/50 text-[10px] font-bold mt-1 uppercase tracking-widest leading-snug">
                    New platform version ready
                  </p>
                </div>
              </div>

              {/* Action Button: Swipess Core Rose */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={isUpdating}
                onClick={handleUpdateClick}
                className="w-full relative overflow-hidden h-14 rounded-2xl transition-all duration-300 group border-none"
                style={{
                  background: 'linear-gradient(90deg, #ff1f1f, #ff6b3d)',
                  boxShadow: '0 8px 30px rgba(255, 31, 31, 0.35)',
                }}
              >
                {/* Button Gloss Rim */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/20 z-20" />
                
                {/* Animated Shine Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent w-1/3 -skew-x-[35deg]"
                  animate={{ left: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />

                <span className="relative z-10 text-white font-black text-sm uppercase tracking-[0.2em]">
                  {isUpdating ? 'Synthesizing...' : 'NEW UPDATE'}
                </span>
              </motion.button>
            </div>
            
            {/* Version Badge */}
            <div className="absolute bottom-2 right-6 opacity-20">
               <span className="text-[8px] text-white/50 font-mono tracking-widest uppercase">
                 Build: {BUILD_TIMESTAMP.slice(-8)}
               </span>
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
    const alreadyReloaded = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (alreadyReloaded && parseInt(alreadyReloaded, 10) >= 2) return;

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
          // Check if already reached cap during the wait
          const currentReloads = parseInt(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0', 10);
          if (currentReloads < 2) {
             forceAppUpdate();
          }
        } else {
          markVersionAsInstalled();
        }
      }, 30000);

      return () => clearTimeout(timer);
    }

    // If already been on page 30s+ (e.g. focus regain), do the normal check
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    if (storedVersion && storedVersion !== BUILD_TIMESTAMP) {
      forceAppUpdate();
      return;
    }

    if (checkHtmlVersionMismatch()) {
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


