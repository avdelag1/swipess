import { useCallback, useEffect, useState } from 'react';
import { Download, Share, Sparkles, X } from 'lucide-react';
import useAppTheme from '@/hooks/useAppTheme';
import { SwipessLogo } from '@/components/SwipessLogo';
import { cn } from '@/lib/utils';

// BeforeInstallPromptEvent is not in the standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'Swipess-pwa-install-dismissed';
const DISMISSED_FOREVER_KEY = 'Swipess-pwa-install-dismissed-forever';
const SHOW_DELAY_MS = 5000; // Show after 5s of use for immediate accessibility

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
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';

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
      className="fixed top-0 left-0 right-0 z-[10000] bg-black/80 backdrop-blur-md border-b border-white/10 shadow-2xl overflow-hidden"
    >
      <div className="w-full max-w-lg mx-auto flex items-center justify-between px-4 py-3 pt-safe-top">
        {/* Left Side: Logo & Text */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-white/40 hover:text-white transition-colors p-1 -ml-2"
          >
            <X size={16} strokeWidth={2} />
          </button>
          
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
             <SwipessLogo size="xs" variant="transparent" />
          </div>
          
          <div className="flex flex-col">
            <span className="text-white font-black text-sm leading-tight">Swipess</span>
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Download the App</span>
          </div>
        </div>

        {/* Right Side: Install Button */}
        <div className="flex items-center gap-2">
          {iosMode ? (
            <button
              onClick={() => alert("Tap the Share icon at the bottom of your browser, then tap 'Add to Home Screen' to install.")}
              className="bg-white text-black px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all"
            >
              Get App
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="bg-white text-black px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


