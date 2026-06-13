import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { cancelReengagementReminders, scheduleReengagementReminders } from '@/utils/localNotifications';

/**
 * Drives re-engagement local notifications off the native app lifecycle:
 * schedule nudges when the app backgrounds, clear them when it returns to the
 * foreground (and on mount, since the user is obviously here). Native-only.
 */
export function useReengagementNotifications(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // User is here right now — clear any pending nudges.
    void cancelReengagementReminders();

    let remove: (() => void) | undefined;
    const sub = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void cancelReengagementReminders();
      } else {
        void scheduleReengagementReminders();
      }
    });
    Promise.resolve(sub).then((handle) => {
      remove = () => handle.remove();
    });

    return () => {
      remove?.();
    };
  }, []);
}
