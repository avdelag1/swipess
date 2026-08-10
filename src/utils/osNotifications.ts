/**
 * Show an OS-level notification when the app is backgrounded / phone locked.
 * No-ops when permission is missing or the page is visibly focused (in-app banner handles that).
 */
export async function showOsNotification(opts: {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  // Prefer OS banner when tab/app is not visible
  const hidden = document.visibilityState === 'hidden' || !document.hasFocus();
  if (!hidden) return false;

  const title = opts.title || 'Swipess';
  const body = opts.body || '';
  const tag = opts.tag || `swipess-${Date.now()}`;
  const data = { url: opts.url || '/notifications' };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag,
        data,
        vibrate: [100, 50, 100],
      } as NotificationOptions);
      return true;
    }
  } catch {
    /* fall through to Notification constructor */
  }

  try {
    const n = new Notification(title, { body, icon: '/icons/icon-192.png', tag, data } as NotificationOptions);
    n.onclick = () => {
      window.focus();
      const url = (data as any).url;
      if (url) window.location.assign(url);
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}
