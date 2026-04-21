import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { NexusLogo } from '@/components/NexusLogo';
import { cn } from '@/lib/utils';

// BeforeInstallPromptEvent is not in the standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'NEXUS DISCOVERY-pwa-install-dismissed';
const DISMISSED_FOREVER_KEY = 'NEXUS DISCOVERY-pwa-install-dismissed-forever';
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
  const { theme } = useTheme();
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
      aria-label="Install NEXUS DISCOVERY app"
      className="fixed bottom-0 left-0 right-0 z-[10000] px-4 pb-safe-bottom"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
    >
      <div className={cn(
        "relative rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-md mx-auto overflow-hidden",
        isDark ? "bg-[#111] border border-white/10" : "bg-white border border-black/5"
      )}>
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-rose-500/10 blur-2xl pointer-events-none" />
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className={cn(
               "w-12 h-12 rounded-2x overflow-hidden flex items-center justify-center",
               isDark ? "bg-zinc-900 border border-white/10" : "bg-gray-50 border border-black/5"
            )}>
               <NexusLogo size="xs" />
            </div>
            <div>
              <p className={cn("font-black text-base tracking-tight leading-tight", isDark ? "text-white" : "text-black")}>NEXUS DISCOVERY</p>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-orange-500" />
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-white/40" : "text-black/40")}>Elite Discovery</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className={cn("transition-colors p-2 -mt-2 -mr-2", isDark ? "text-white/20 hover:text-white/50" : "text-black/20 hover:text-black/50")}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <p className={cn("text-sm mt-4 font-bold leading-relaxed", isDark ? "text-white/70" : "text-black/60")}>
          {iosMode
            ? 'Install NEXUS DISCOVERY for a premium, edge-to-edge native experience.'
            : 'Get the app for faster navigation and real-time elite discovery.'}
        </p>
 
        {/* iOS instructions */}
        {iosMode && (
          <div className={cn(
             "mt-4 rounded-2xl px-4 py-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest",
             isDark ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"
          )}>
            <Share size={16} className="flex-shrink-0 text-orange-500" />
            <span>Tap <strong className={isDark ? "text-white" : "text-black"}>Share</strong> then <strong className={isDark ? "text-white" : "text-black"}>"Add to Home Screen"</strong></span>
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
            className={cn(
              "flex-1 text-xs font-semibold transition-colors py-2.5 px-3 rounded-xl border",
              isDark
                ? "text-white/70 hover:text-white border-white/20 hover:border-white/40"
                : "text-black/60 hover:text-black border-black/15 hover:border-black/30"
            )}
          >
            {iosMode ? 'Maybe later' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  );
}

