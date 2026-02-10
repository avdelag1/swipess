import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Share2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if already in standalone mode (installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Always show banner after a delay on main page
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 2000);

    // For Android/Chrome, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: 'Swipess',
      text: 'Check out Swipess - Find your perfect match for properties, vehicles & more!',
      url: import.meta.env.VITE_APP_URL || 'https://swipess.com',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
      }
    } catch (error) {
      // User cancelled or error - silently ignore
    }
  }, []);

  const handleInstall = useCallback(async () => {
    // If we have a native install prompt (Chrome/Android), use it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        if (import.meta.env.DEV) logger.error('Install prompt error:', error);
      }
      return;
    }

    // Otherwise show manual install instructions
    setShowInstallInstructions(true);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowInstallInstructions(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none"
        >
          {showInstallInstructions ? (
            // Install Instructions Card - Enhanced design
            <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-gray-900/98 via-gray-800/98 to-black/98 p-5 shadow-2xl backdrop-blur-xl max-w-sm pointer-events-auto">
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />

              <button
                onClick={handleDismiss}
                className="absolute right-3 top-3 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white z-10"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-8 space-y-4 relative z-10">
                <h3 className="font-bold text-white text-base">Install <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Swipess</span></h3>
                <div className="space-y-3 text-sm text-white/80">
                  {isIOS ? (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Share className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm mb-1">Step 1</div>
                          <span className="text-white/70 text-xs">Tap the <strong className="text-white">Share</strong> button at the bottom of Safari</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <Plus className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm mb-1">Step 2</div>
                          <span className="text-white/70 text-xs">Select <strong className="text-white">"Add to Home Screen"</strong></span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl text-blue-400">⋮</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm mb-1">Step 1</div>
                          <span className="text-white/70 text-xs">Tap the browser menu <strong className="text-white">(3 dots)</strong> at the top</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <Plus className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm mb-1">Step 2</div>
                          <span className="text-white/70 text-xs">Select <strong className="text-white">"Add to Home Screen"</strong> or <strong className="text-white">"Install App"</strong></span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowInstallInstructions(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 transition-all text-sm font-semibold shadow-lg shadow-orange-500/30"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Main banner - Enhanced authentic design
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={handleInstall}
                className="group flex items-center gap-3 pl-2 pr-5 py-2 rounded-2xl bg-gradient-to-br from-gray-900/98 via-gray-800/98 to-black/98 shadow-2xl shadow-orange-500/40 border border-orange-500/40 backdrop-blur-xl hover:shadow-orange-500/60 hover:border-orange-500/60 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* S Logo App Icon */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-xl ring-2 ring-orange-500/30 group-hover:ring-orange-500/50 transition-all duration-300">
                  <motion.img
                    src="/icons/s-logo-app.png"
                    alt="Swipess"
                    className="w-full h-full object-cover"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                {/* Text with enhanced styling */}
                <div className="flex flex-col items-start relative z-10">
                  <span className="text-white font-bold text-base whitespace-nowrap tracking-tight">
                    {isStandalone ? 'Share Swipess' : 'Get the App'}
                  </span>
                  <span className="text-orange-400 font-medium text-xs whitespace-nowrap">
                    {isStandalone ? 'Invite your friends' : 'Install now - it\'s free!'}
                  </span>
                </div>

                {/* Close button */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                  }}
                  className="ml-2 rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-all relative z-10"
                >
                  <X className="w-4 h-4" />
                </div>
              </button>

              {/* Separate Share button - enhanced design */}
              <button
                onClick={handleShare}
                className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/90 to-orange-600/90 shadow-2xl shadow-orange-500/50 border border-orange-400/50 backdrop-blur-xl hover:from-orange-400/90 hover:to-orange-500/90 hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                aria-label="Share app"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Share2 className="w-5 h-5 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
