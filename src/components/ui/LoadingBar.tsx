import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoadingStore } from '@/state/loadingStore';

/**
 * SPEED OF LIGHT LOADING BAR — THE "TINDER" SECRET
 * 
 * A liquid glass progress bar that sits at the Top of the TopBar.
 * It shows "Flicker" & "Pulse" animations when a long transition happens.
 */
export const LoadingBar = () => {
  const { isLoading, progress } = useLoadingStore();
  const [visible, setVisible] = useState(false);

  // Buffer visibility to prevent "flashes" for fast (instant) loads
  useEffect(() => {
    if (isLoading) {
      const id = setTimeout(() => setVisible(true), 250); // Same threshold as SmartSuspense
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => setVisible(false), 800); // Leave it for 800ms at 100% then hide
      return () => clearTimeout(id);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {(visible || isLoading) && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none origin-top"
          style={{
            background: 'linear-gradient(90deg, #FF4D00, #EB4898)',
            boxShadow: '0 0 10px rgba(139,92,246,0.6)',
          }}
        >
          {/* Progress fill */}
          <motion.div
            className="h-full bg-white/40"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 20,
              mass: 0.8,
            }}
          />

          {/* Liquid Glass Highlight (animated shine) */}
          {isLoading && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 w-1/3 h-full overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
              }}
            />
          )}

          {/* Pulse Shadow */}
          {isLoading && (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute -bottom-[20px] left-0 right-0 h-[30px]"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.2) 0%, transparent 70%)',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};


