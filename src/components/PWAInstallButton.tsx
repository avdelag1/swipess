import { useState } from 'react';
import { Download, Share, X, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAMode } from '@/hooks/usePWAMode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PWAInstallButton({ className }: { className?: string }) {
  const { deferredPrompt, promptInstall, isIOS, isPWA } = usePWAMode();
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  // If already running as PWA, don't show the install button
  if (isPWA) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setShowIosInstructions(true);
    } else if (deferredPrompt) {
      await promptInstall();
    } else {
      // Fallback for when event hasn't fired yet or not supported
      setShowIosInstructions(true); 
    }
  };

  return (
    <>
      <Button
        onClick={handleInstall}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-bold transition-all active:scale-95 shadow-xl",
          "bg-gradient-to-r from-orange-500 to-pink-600 text-white border-none hover:opacity-90",
          className
        )}
      >
        <Download className="w-5 h-5" />
        Install Swipess App
      </Button>

      <AnimatePresence>
        {showIosInstructions && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowIosInstructions(false)}
                className="absolute top-4 right-4 text-muted-foreground p-1"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-40 h-12 overflow-hidden mb-2 flex items-center justify-center">
                  <img src="/icons/Swipess-wordmark-white.svg" alt="Swipess" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/icons/Swipess-wordmark-512.png'; }} />
                </div>
                
                <h3 className="text-xl font-black tracking-tight">Install Swipess</h3>
                
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-3 text-left bg-muted/50 p-4 rounded-2xl border border-border">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Share className="w-5 h-5 text-primary" />
                    </div>
                    <p>Tap the <span className="font-bold text-foreground">Share</span> icon in your browser's navigation bar.</p>
                  </div>

                  <div className="flex items-start gap-3 text-left bg-muted/50 p-4 rounded-2xl border border-border">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Layout className="w-5 h-5 text-primary" />
                    </div>
                    <p>Scroll down and select <span className="font-bold text-foreground">"Add to Home Screen"</span>.</p>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowIosInstructions(false)}
                  variant="outline"
                  className="mt-4 w-full rounded-xl py-6"
                >
                  Got it
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}


