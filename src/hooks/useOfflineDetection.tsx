import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { appToast } from '@/utils/appNotification';

/**
 * Online/offline awareness.
 *
 * On a device we use the Capacitor Network plugin — far more reliable than
 * `navigator.onLine`, which inside a WebView often reports "online" even with
 * no real connectivity and doesn't fire consistently. On web/PWA we fall back
 * to the browser online/offline events. Toasts only fire on an actual
 * transition, so a flaky connection won't spam the user.
 */
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const onlineRef = useRef(isOnline);

  useEffect(() => {
    const apply = (connected: boolean) => {
      if (connected === onlineRef.current) return;
      onlineRef.current = connected;
      setIsOnline(connected);
      if (connected) {
        appToast.info("Back Online! 🌐", "Your connection has been restored.");
      } else {
        appToast.error("Connection Lost 📱", "You're now offline. Some features may be limited.");
      }
    };

    if (Capacitor.isNativePlatform()) {
      let remove: (() => void) | undefined;
      Network.getStatus()
        .then((status) => {
          onlineRef.current = status.connected;
          setIsOnline(status.connected);
        })
        .catch(() => { /* ignore */ });
      const sub = Network.addListener('networkStatusChange', (status) => apply(status.connected));
      Promise.resolve(sub).then((handle) => {
        remove = () => handle.remove();
      });
      return () => {
        remove?.();
      };
    }

    const handleOnline = () => apply(true);
    const handleOffline = () => apply(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
