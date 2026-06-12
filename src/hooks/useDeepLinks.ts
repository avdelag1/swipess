import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        // Preserve the hash fragment — OAuth callbacks deliver the access/refresh
        // tokens there (e.g. #access_token=...). Dropping it loses the session.
        const path = parsed.pathname + parsed.search + parsed.hash;
        if (path && path !== '/') {
          navigate(path);
        }
      } catch { /* invalid URL */ }
    };

    const listener = App.addListener('appUrlOpen', (event) => {
      handleUrl(event.url);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);
}
