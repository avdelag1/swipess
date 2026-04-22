import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface WelcomeNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeNotification({ isOpen, onClose }: WelcomeNotificationProps) {
  const { theme } = useAppTheme();
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
              isDark
                ? "bg-card/95 border border-border/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                : "bg-white border border-border/20 shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
            )}
          >
            <div className="px-4 py-3.5 flex items-center gap-3">
              {/* Icon */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10"
              >
                <Sparkles className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[13px] leading-tight text-foreground">
                  Welcome to Swipess
                </h3>
                <p className="text-xs font-normal mt-0.5 truncate text-muted-foreground">
                  Swipe to find your perfect match
                </p>
              </div>

              {/* Close */}
              <button
                onClick={handleClose}
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-muted text-muted-foreground"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="h-[1.5px] bg-primary/20"
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


