import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

// Request badge permission at most once per app session (iOS; on Android it's a
// no-op). Notification permission is normally already granted via the push flow.
let permissionRequested = false;

/**
 * Mirrors the unread-notifications count onto the native home-screen app icon
 * badge (@capawesome/capacitor-badge). Updates whenever the count changes and
 * clears at zero. No-op on web / when unsupported or unpermitted.
 */
export function useAppBadge(): void {
  const { unreadCount } = useUnreadNotifications();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;

    (async () => {
      try {
        const { Badge } = await import('@capawesome/capacitor-badge');
        if (cancelled) return;

        if (!permissionRequested) {
          permissionRequested = true;
          try {
            await Badge.requestPermissions();
          } catch {
            /* unsupported / already decided — ignore */
          }
          if (cancelled) return;
        }

        if (unreadCount > 0) {
          await Badge.set({ count: unreadCount });
        } else {
          await Badge.clear();
        }
      } catch {
        // Plugin unavailable or permission not granted — ignore.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [unreadCount]);
}
