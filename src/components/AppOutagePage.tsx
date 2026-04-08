import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OUTAGE_BYPASS_KEY } from '@/config/outage';

interface AppOutagePageProps {
  onBypass: () => void;
}

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
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-6 text-center overflow-hidden relative"
      style={{ background: '#050505' }}
    >
      {/* Ambient background auras */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full blur-[120px] opacity-[0.07]"
          style={{
            width: 400,
            height: 400,
            top: '20%',
            left: '10%',
            background: 'radial-gradient(circle, #f97316, #ec4899, transparent)',
          }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-[100px] opacity-[0.05]"
          style={{
            width: 300,
            height: 300,
            bottom: '15%',
            right: '5%',
            background: 'radial-gradient(circle, #a855f7, #6366f1, transparent)',
          }}
          animate={{
            x: [0, -30, 15, 0],
            y: [0, 25, -15, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Logo with living internal light */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={handleLogoTap}
        className="cursor-default select-none mb-6 relative z-10"
        aria-label="Swipess logo"
      >
        <div className="relative inline-flex items-center justify-center">
          <svg
            viewBox="0 0 420 70"
            className="h-auto w-[340px] max-w-[88vw] sm:w-[460px]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="logo-base" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316">
                  <animate attributeName="stop-color" values="#f97316;#ec4899;#a855f7;#f97316" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#ec4899">
                  <animate attributeName="stop-color" values="#ec4899;#6366f1;#f97316;#ec4899" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#a855f7">
                  <animate attributeName="stop-color" values="#a855f7;#f97316;#ec4899;#a855f7" dur="6s" repeatCount="indefinite" />
                </stop>
              </linearGradient>

              <linearGradient id="logo-sheen" x1="-50%" y1="0%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                <animate attributeName="x1" values="-50%;90%;-50%" dur="5s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0%;140%;0%" dur="5s" repeatCount="indefinite" />
              </linearGradient>

              <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <text
              x="210"
              y="55"
              textAnchor="middle"
              fill="url(#logo-base)"
              opacity="0.32"
              filter="url(#logo-glow)"
              style={{
                fontSize: '58px',
                fontWeight: 950,
                fontStyle: 'italic',
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              SwipesS
            </text>

            <text
              x="210"
              y="55"
              textAnchor="middle"
              fill="url(#logo-base)"
              style={{
                fontSize: '58px',
                fontWeight: 950,
                fontStyle: 'italic',
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              SwipesS
            </text>

            <text
              x="210"
              y="55"
              textAnchor="middle"
              fill="url(#logo-sheen)"
              opacity="0.7"
              filter="url(#logo-glow)"
              style={{
                fontSize: '58px',
                fontWeight: 950,
                fontStyle: 'italic',
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              SwipesS
            </text>
          </svg>
        </div>
      </motion.div>

      {/* Heading — closer to logo */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-white text-2xl sm:text-3xl font-semibold tracking-tight mb-2 relative z-10"
      >
        We'll be right back
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-white/50 text-sm leading-relaxed max-w-xs relative z-10"
      >
        Swipess is currently down for scheduled maintenance.
        We're working hard to get things back up — check back soon.
      </motion.p>

      {/* Pulsing status beacon — dramatic on/off glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2.5 mt-6 relative z-10"
      >
        <span className="relative flex h-3 w-3">
          {/* Outer breathing glow ring */}
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-orange-400"
            animate={{
              opacity: [0, 0.7, 0],
              scale: [1, 2.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Inner dot — blinks on/off */}
          <motion.span
            className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"
            animate={{
              opacity: [1, 0.3, 1],
              boxShadow: [
                '0 0 8px 2px rgba(249,115,22,0.6)',
                '0 0 2px 0px rgba(249,115,22,0.1)',
                '0 0 8px 2px rgba(249,115,22,0.6)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </span>
        <span className="text-white/40 text-xs tracking-wide uppercase" style={{ letterSpacing: '0.15em' }}>
          Maintenance in progress
        </span>
      </motion.div>

      {/* Hidden tap hint */}
      <AnimatePresence>
        {showHint && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-white/20 text-xs relative z-10"
          >
            {TAP_THRESHOLD - tapCount} more tap{TAP_THRESHOLD - tapCount !== 1 ? 's' : ''} to unlock
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
