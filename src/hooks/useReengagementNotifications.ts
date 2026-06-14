import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { cancelReengagementReminders, scheduleReengagementReminders } from '@/utils/localNotifications';

/**
 * Drives re-engagement local notifications off the native app lifecycle:
 * schedule nudges when the app backgrounds, clear them when it returns to the
 * foreground (and on mount, since the user is obviously here), and route a
 * tapped nudge into the app. Native-only.
 */
export function useReengagementNotifications(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // User is here right now — clear any pending nudges.
    void cancelReengagementReminders();

    let removeState: (() => void) | undefined;
    let removeTap: (() => void) | undefined;

    const stateSub = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void cancelReengagementReminders();
      } else {
        void scheduleReengagementReminders();
      }
    });
    Promise.resolve(stateSub).then((handle) => {
      removeState = () => handle.remove();
    });

    // Tapping a re-engagement nudge routes into the app (mirrors the push handler).
    const tapSub = LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const url = (event.notification?.extra as { url?: string } | undefined)?.url || '/notifications';
      const target = url.startsWith('/') ? url : `/${url}`;
      try { localStorage.setItem('swipess_pending_notif_url', target); } catch (_) { /* ignore */ void 0; }
      setTimeout(() => {
        if (window.history && window.history.pushState) {
          window.history.pushState({}, '', target);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        if (document.visibilityState !== 'visible' || window.location.pathname !== target) {
          window.location.assign(target);
        }
      }, 30);
    });
    Promise.resolve(tapSub).then((handle) => {
      removeTap = () => handle.remove();
    });

    return () => {
      removeState?.();
      removeTap?.();
    };
  }, []);
}
