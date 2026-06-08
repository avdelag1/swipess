import { useEffect, useState } from 'react';
import { appToast } from '@/utils/appNotification';
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      appToast.info("Back Online! 🌐", "Your connection has been restored.");
    };

    const handleOffline = () => {
      setIsOnline(false);
      appToast.error("Connection Lost 📱", "You're now offline. Some features may be limited.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}


