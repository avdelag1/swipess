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
import { toast } from '@/hooks/use-toast';

// Get build timestamp from Vite injected environment variable
// This changes EVERY deployment, ensuring all users get updates
const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIME || Date.now().toString();

// Current app version - derived from build timestamp for automatic updates
export const APP_VERSION = `1.0.${BUILD_TIMESTAMP.slice(-6)}`;

// Storage key for version tracking
const VERSION_STORAGE_KEY = 'zwipes_app_version';
const SW_REGISTRATION_KEY = 'zwipes_sw_registration';

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
    console.error('Failed to update app:', error);
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
    setUpdateInfo(info);

    if (info.available) {
      // Invalidate all React Query caches
      queryClient.clear();
      // UpdateNotification component handles the visual banner - no toast needed
    }
  }, [queryClient]);

  const performUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
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
      console.error('Update failed:', error);
      setIsUpdating(false);
      toast({
        title: 'Update Failed',
        description: 'Please refresh the page or clear your browser cache.',
        variant: 'destructive',
      });
    }
  }, [isUpdating, queryClient]);

  useEffect(() => {
    // Check for updates on mount
    checkUpdates();

    // Also check when app gains focus (user returns to tab)
    const handleFocus = () => checkUpdates();
    window.addEventListener('focus', handleFocus);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available - UpdateNotification component handles the UI
                setUpdateInfo({
                  available: true,
                  version: APP_VERSION,
                  needsRefresh: true,
                });
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkUpdates, performUpdate]);

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

  if (!updateInfo.available) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-xl shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold">Update Available</h4>
            <p className="text-sm text-white/90 mt-1">
              New version {APP_VERSION} is ready!
            </p>
            <button
              onClick={performUpdate}
              disabled={isUpdating}
              className="mt-3 w-full bg-white text-orange-500 font-bold py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Tap to Restart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Force update on app mount - use when you want guaranteed updates
 * This clears all caches and reloads if version changed (based on BUILD_TIMESTAMP)
 */
export function useForceUpdateOnVersionChange() {
  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    if (storedVersion && storedVersion !== BUILD_TIMESTAMP) {
      // Version changed - force update
      forceAppUpdate();
    } else {
      // Mark current version as installed
      markVersionAsInstalled();
    }
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
