import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share } from 'lucide-react';

// BeforeInstallPromptEvent is not in the standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'swipess-pwa-install-dismissed';
const DISMISSED_FOREVER_KEY = 'swipess-pwa-install-dismissed-forever';
const SHOW_DELAY_MS = 45000; // Show after 45s of use

function isIOS() {
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isAlreadyInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISSED_KEY);
  if (!ts) return false;
  // Snooze for 3 days
  return Date.now() - parseInt(ts, 10) < 3 * 24 * 60 * 60 * 1000;
}

function wasDismissedForever(): boolean {
  return localStorage.getItem(DISMISSED_FOREVER_KEY) === '1';
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    // Skip if already installed or dismissed forever
    if (isAlreadyInstalled() || wasDismissedForever() || wasDismissedRecently()) return;

    const ios = isIOS();
    setIosMode(ios);

    if (ios) {
      // iOS Safari doesn't fire beforeinstallprompt — show manual instructions after delay
      const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(t);
    }

    // Android / Chrome / Edge: listen for the native install event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      // Store timeout id for cleanup
      (handler as { _t?: ReturnType<typeof setTimeout> })._t = t;
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      const t = (handler as { _t?: ReturnType<typeof setTimeout> })._t;
      if (t) clearTimeout(t);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }, []);

  const handleDismissForever = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISSED_FOREVER_KEY, '1');
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Swipess app"
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-safe-bottom"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl max-w-md mx-auto">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icons/swipess-logo.png"
              alt="Swipess"
              width={44}
              height={44}
              className="rounded-xl flex-shrink-0"
              loading="eager"
            />
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Swipess</p>
              <p className="text-white/50 text-xs">swipess.vercel.app</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-white/40 hover:text-white/70 transition-colors p-1 -mt-1 -mr-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <p className="text-white/70 text-sm mt-3 leading-snug">
          {iosMode
            ? 'Install Swipess on your iPhone for instant access — no app store needed.'
            : 'Install the app for a faster, native-like experience — works offline too.'}
        </p>

        {/* iOS instructions */}
        {iosMode && (
          <div className="mt-3 bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2 text-white/60 text-xs">
            <Share size={14} className="flex-shrink-0 text-[#f97316]" />
            Tap <strong className="text-white/80 mx-0.5">Share</strong> then
            <strong className="text-white/80 mx-0.5">"Add to Home Screen"</strong>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {!iosMode && (
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea6c10] active:scale-95 transition-all text-white text-sm font-semibold rounded-xl py-2.5 px-4"
            >
              <Download size={16} />
              Install
            </button>
          )}
          <button
            onClick={handleDismissForever}
            className="flex-1 text-white/40 hover:text-white/60 text-xs transition-colors py-2.5 px-3 rounded-xl border border-white/10 hover:border-white/20"
          >
            {iosMode ? 'Maybe later' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  );
}
