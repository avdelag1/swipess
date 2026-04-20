/**
 * usePushNotifications
 *
 * Manages the full lifecycle of Push Notifications (Web & Native):
 *   1. Check support (standard or native via Capacitor)
 *   2. Request permission (only on explicit user action)
 *   3. Register/Subscribe (Standard VAPID or Native FCM/APNS)
 *   4. Persist in database (push_subscriptions table)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';
import { logSupabaseError } from '@/lib/supabaseError';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isSupported = isNative() || (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window);

  // ─── Initial Sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupported) return;

    if (isNative()) {
      PushNotifications.checkPermissions().then((res) => {
        setPermission(res.receive as any);
      });
    } else {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  // ─── Native Registration Handler ──────────────────────────────────────────
  useEffect(() => {
    if (!isNative() || !user?.id) return;

    const addListeners = async () => {
      await PushNotifications.addListener('registration', async (token) => {
        logger.info('[PushNative] Registered with token:', token.value);
        
        const { error } = await (supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            endpoint: token.value,
            p256dh: 'native',
            auth: 'native',
            platform: Capacitor.getPlatform(),
            user_agent: `Capacitor-${Capacitor.getPlatform()}`,
          }, { onConflict: 'user_id,endpoint' }) as any);

        if (!error) setIsSubscribed(true);
      });

      await PushNotifications.addListener('registrationError', (err) => {
        logger.error('[PushNative] Registration error:', err.error);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const url = action.notification.data?.url || '/notifications';
        window.location.href = url;
      });
    };

    addListeners();
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user?.id]);

  /**
   * Universal Subscribe
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user?.id) return false;

    if (isNative()) {
      try {
        const perm = await PushNotifications.requestPermissions();
        setPermission(perm.receive as any);
        if (perm.receive === 'granted') {
          await PushNotifications.register();
          return true;
        }
        return false;
      } catch (err) {
        logger.error('[PushNative] Subscribe error:', err);
        return false;
      }
    }

    // Web Push Logic
    if (!VAPID_PUBLIC_KEY) return false;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey as any,
      });

      const subJSON = sub.toJSON();
      const { error } = await (supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subJSON.endpoint!,
          p256dh: subJSON.keys?.p256dh || '',
          auth: subJSON.keys?.auth || '',
          platform: 'web',
          user_agent: navigator.userAgent.slice(0, 255),
        }, { onConflict: 'user_id,endpoint' }) as any);

      if (error) return false;
      setIsSubscribed(true);
      return true;
    } catch (err) {
      logger.error('[PushWeb] Subscribe error:', err);
      return false;
    }
  }, [isSupported, user?.id]);

  /**
   * Universal Unsubscribe
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user?.id) return false;

    if (isNative()) {
      const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      logSupabaseError('push_subscriptions.delete(native)', error);
      setIsSubscribed(false);
      return true;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint);
        logSupabaseError('push_subscriptions.delete(web)', error);
      }
      setIsSubscribed(false);
      return true;
    } catch (err) {
      logger.error('[PushWeb] Unsubscribe error:', err);
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
