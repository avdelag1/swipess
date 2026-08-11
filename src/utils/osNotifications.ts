/**
 * Show an OS-level notification (phone lock screen / banner).
 * iOS installed PWAs only support ServiceWorkerRegistration.showNotification —
 * `new Notification()` is unreliable or blocked there.
 */
const DEFAULT_ICON = '/icons/icon-192.png';

export async function showOsNotification(opts: {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  /** When true, show even if the page is focused (useful as a fallback). */
  force?: boolean;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  const hidden = document.visibilityState === 'hidden' || !document.hasFocus();
  if (!opts.force && !hidden) return false;

  const title = opts.title || 'Swipess';
  const body = opts.body || '';
  const tag = opts.tag || `swipess-${Date.now()}`;
  const data = { url: opts.url || '/notifications' };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: DEFAULT_ICON,
        badge: DEFAULT_ICON,
        tag,
        data,
        ...( { vibrate: [100, 50, 100] } as NotificationOptions ),
      });
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const n = new Notification(title, {
      body,
      icon: DEFAULT_ICON,
      tag,
      data,
    } as NotificationOptions);
    n.onclick = () => {
      window.focus();
      const url = (data as { url?: string }).url;
      if (url) window.location.assign(url);
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}
