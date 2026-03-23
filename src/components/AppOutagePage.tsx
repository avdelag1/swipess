import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OUTAGE_BYPASS_KEY } from '@/config/outage';
import { SwipessLogo } from './SwipessLogo';
const _swipessLogo = '/icons/swipess-logo.png';

interface AppOutagePageProps {
  onBypass: () => void;
}

/**
 * Full-screen outage / maintenance page.
 *
 * Bypass options:
 *  1. Visit the app with ?preview=swipess in the URL (handled in App.tsx before this renders).
 *  2. Tap the logo 7× quickly to unlock internal access.
 */
export function AppOutagePage({ onBypass }: AppOutagePageProps) {
  const [tapCount, setTapCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const TAP_THRESHOLD = 7;

  const handleLogoTap = useCallback(() => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= TAP_THRESHOLD) {
        sessionStorage.setItem(OUTAGE_BYPASS_KEY, '1');
        onBypass();
        return 0;
      }
      if (next >= TAP_THRESHOLD - 2) {
        setShowHint(true);
      }
      return next;
    });
  }, [onBypass]);

  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#050505' }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={handleLogoTap}
        className="cursor-default select-none mb-10"
        aria-label="Swipess logo"
      >
        <SwipessLogo
          size="xl"
          className="mx-auto"
        />
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-white text-2xl font-semibold tracking-tight mb-3"
      >
        We'll be right back
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-white/50 text-sm leading-relaxed max-w-xs"
      >
        Swipess is currently down for scheduled maintenance.
        We're working hard to get things back up — check back soon.
      </motion.p>

      {/* Pulsing status dot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 mt-8"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
        </span>
        <span className="text-white/35 text-xs tracking-wide">Maintenance in progress</span>
      </motion.div>

      {/* Hidden tap hint */}
      <AnimatePresence>
        {showHint && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-white/20 text-xs"
          >
            {TAP_THRESHOLD - tapCount} more tap{TAP_THRESHOLD - tapCount !== 1 ? 's' : ''} to unlock
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
