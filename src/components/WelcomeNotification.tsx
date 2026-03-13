import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface WelcomeNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeNotification({ isOpen, onClose }: WelcomeNotificationProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-4 left-4 right-4 z-[9999] flex justify-start pointer-events-none"
          initial={{ opacity: 0, y: -48, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          <div
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-2xl overflow-hidden",
              // Glass card base — theme-aware
              isDark
                ? "bg-card/80 border border-border/20 shadow-[0_16px_48px_rgba(0,0,0,0.7)]"
                : "bg-card/90 border border-border/30 shadow-[0_12px_40px_rgba(0,0,0,0.14)]",
              "backdrop-blur-2xl"
            )}
          >
            {/* Subtle top accent line */}
            <div
              className="h-[2px] w-full"
              style={{ background: 'linear-gradient(90deg, #f97316, #e11d48, #a855f7)' }}
            />

            <div className="px-4 py-3.5 flex items-center gap-3">
              {/* Icon */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(168,85,247,0.15))' }}
              >
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm leading-tight tracking-tight text-foreground">
                  Welcome to Swipess
                </h3>
                <p className="text-xs mt-0.5 truncate text-muted-foreground">
                  Swipe to find your perfect match
                </p>
              </div>

              {/* Arrow hint + close */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="h-[2px] bg-foreground/10"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
              onAnimationComplete={handleClose}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeNotification;
