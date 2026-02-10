import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface WelcomeNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SPEED OF LIGHT: Simple, fast welcome banner notification.
 * Auto-dismisses in 4 seconds. GPU-accelerated animations.
 */
export function WelcomeNotification({ isOpen, onClose }: WelcomeNotificationProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-4 left-4 right-4 z-[9999] flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
        >
          <div className="pointer-events-auto max-w-sm w-full bg-gradient-to-r from-primary via-orange-500 to-amber-500 rounded-xl shadow-xl shadow-primary/20 border border-white/10 overflow-hidden">
            {/* Banner Content */}
            <div className="relative px-4 py-3">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-2 top-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150 focus:outline-none"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2.5 pr-6">
                {/* Icon */}
                <div className="shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-white font-bold text-base leading-tight">
                    Welcome to Swipess! 🎉
                  </h3>
                  <p className="text-white/85 text-sm">
                    Start swiping to find your perfect match
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar - 4 second auto-dismiss */}
            <motion.div
              className="h-0.5 bg-white/40"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              onAnimationComplete={handleClose}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeNotification;