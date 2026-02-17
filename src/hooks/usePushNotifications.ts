/**
 * usePushNotifications
 *
 * Manages the full lifecycle of Web Push Notifications:
 *   1. Check browser support
 *   2. Request permission from the user (only when explicitly called)
 *   3. Subscribe via PushManager using the VAPID public key
 *   4. Persist the subscription in Supabase (push_subscriptions table)
 *   5. Unsubscribe and remove the record when the user opts out
 *
 * Usage:
 *   const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

// VAPID public key from environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
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
        const existing = await registration.pushManager.getSubscription();
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
      logger.warn('[PushNotifications] Push not supported in this browser');
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

      // 3. Unsubscribe from any existing subscription first to get a fresh one
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      // 4. Create new push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJSON = subscription.toJSON();
      const endpoint = subJSON.endpoint!;
      const p256dh = (subJSON.keys as { p256dh: string; auth: string }).p256dh;
      const auth = (subJSON.keys as { p256dh: string; auth: string }).auth;

      // 5. Save to Supabase (upsert so re-subscribing updates the record)
      const { error } = await supabase
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
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Remove from DB
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', endpoint);
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
