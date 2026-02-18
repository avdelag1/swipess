/**
 * usePushNotifications
 *
 * Manages the full lifecycle of Web Push Notifications:
 *   1. Check browser support
 *   2. Request permission from the user (only when explicitly called)
 *   3. Subscribe via PushManager using the VAPID public key
 *   4. Persist the subscription in the database (push_subscriptions table)
 *   5. Unsubscribe and remove the record when the user opts out
 *
 * NOTE: On native iOS/Android (Capacitor), Web Push is NOT supported.
 * This hook silently skips all logic when running in a native platform.
 *
 * Usage:
 *   const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

// VAPID public key from environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

// Detect Capacitor native platform (iOS/Android) — Web Push doesn't work there
function isNativePlatform(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Capacitor } = (window as any);
    return Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isPushSupported(): boolean {
  if (isNativePlatform()) return false; // Native iOS/Android — skip Web Push
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Typed accessor for pushManager to avoid DOM lib gaps
function getPushManager(registration: ServiceWorkerRegistration): PushManager | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (registration as any).pushManager ?? null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isSupported = isPushSupported();

  // Sync current permission state
  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
  }, [isSupported]);

  // Check if user already has an active subscription on mount
  useEffect(() => {
    if (!isSupported || !user?.id) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const pm = getPushManager(registration);
        const existing = await pm?.getSubscription();
        if (existing) {
          setIsSubscribed(true);
        }
      } catch (err) {
        logger.error('[PushNotifications] Error checking subscription:', err);
      }
    };

    checkSubscription();
  }, [isSupported, user?.id]);

  // Listen for NOTIFICATION_CLICK messages from the service worker
  useEffect(() => {
    if (!isSupported) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const url = event.data.url || '/notifications';
        window.location.href = url;
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [isSupported]);

  /**
   * Request permission + subscribe to push + save to DB.
   * Only call this in response to a direct user action (button click).
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      logger.warn('[PushNotifications] Push not supported in this browser/platform');
      return false;
    }
    if (!user?.id) {
      logger.warn('[PushNotifications] User not authenticated');
      return false;
    }
    if (!VAPID_PUBLIC_KEY) {
      logger.error('[PushNotifications] VITE_VAPID_PUBLIC_KEY is not set');
      return false;
    }

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        logger.info('[PushNotifications] Permission denied:', perm);
        return false;
      }

      // 2. Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const pm = getPushManager(registration);
      if (!pm) {
        logger.error('[PushNotifications] PushManager not available');
        return false;
      }

      // 3. Unsubscribe from any existing subscription first to get a fresh one
      const existing = await pm.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      // 4. Create new push subscription
      // Cast to ArrayBuffer to satisfy strict TypeScript DOM lib types
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await pm.subscribe({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array(appServerKey.buffer as ArrayBuffer),
      });

      const subJSON = subscription.toJSON();
      const endpoint = subJSON.endpoint!;
      const p256dh = (subJSON.keys as { p256dh: string; auth: string }).p256dh;
      const auth = (subJSON.keys as { p256dh: string; auth: string }).auth;

      // 5. Save to database (upsert so re-subscribing updates the record)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            endpoint,
            p256dh,
            auth,
            platform: 'web',
            user_agent: navigator.userAgent.slice(0, 255),
          },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) {
        logger.error('[PushNotifications] Failed to save subscription:', error);
        return false;
      }

      setIsSubscribed(true);
      logger.info('[PushNotifications] Successfully subscribed to push notifications');
      return true;
    } catch (err) {
      logger.error('[PushNotifications] Subscribe error:', err);
      return false;
    }
  }, [isSupported, user?.id]);

  /**
   * Unsubscribe from push notifications and remove from DB.
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user?.id) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const pm = getPushManager(registration);

      if (pm) {
        const subscription = await pm.getSubscription();

        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();

          // Remove from DB
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', endpoint);
        }
      }

      setIsSubscribed(false);
      logger.info('[PushNotifications] Unsubscribed from push notifications');
      return true;
    } catch (err) {
      logger.error('[PushNotifications] Unsubscribe error:', err);
      return false;
    }
  }, [isSupported, user?.id]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
  };
}
