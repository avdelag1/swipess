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
        const path = parsed.pathname + parsed.search;
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
