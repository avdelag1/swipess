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
      } catch (_) { /* ignore invalid deep link URLs */ void 0; }
    };

    const listener = App.addListener('appUrlOpen', (event) => {
      handleUrl(event.url);
    });

    // Also consume pending notification taps from push/local listeners (set before reload or on resume)
    const checkPending = () => {
      try {
        const pending = localStorage.getItem('swipess_pending_notif_url');
        if (pending) {
          localStorage.removeItem('swipess_pending_notif_url');
          // Delay to let router/auth settle
          setTimeout(() => navigate(pending), 80);
        }
      } catch (_) { /* ignore storage/nav errors for pending notifs */ void 0; }
    };
    checkPending();
    const onFocus = () => checkPending();
    window.addEventListener('focus', onFocus);

    return () => {
      listener.then(l => l.remove());
      window.removeEventListener('focus', onFocus);
    };
  }, [navigate]);
}
