import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OUTAGE_BYPASS_KEY } from '@/config/outage';

interface AppOutagePageProps {
  onBypass: () => void;
}

export function AppOutagePage({ onBypass }: AppOutagePageProps) {
  const [tapCount, setTapCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [sheenActive, setSheenActive] = useState(false);
  const sheenTimeout = useRef<ReturnType<typeof setTimeout>>();
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

  // Random sheen trigger every 6-12 seconds
  useEffect(() => {
    const scheduleSheen = () => {
      const delay = 6000 + Math.random() * 6000; // 6-12s
      sheenTimeout.current = setTimeout(() => {
        setSheenActive(true);
        setTimeout(() => {
          setSheenActive(false);
          scheduleSheen();
        }, 1200); // sheen duration
      }, delay);
    };
    // First sheen after 2s
    sheenTimeout.current = setTimeout(() => {
      setSheenActive(true);
      setTimeout(() => {
        setSheenActive(false);
        scheduleSheen();
      }, 1200);
    }, 2000);
    return () => clearTimeout(sheenTimeout.current);
  }, []);

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

      {/* Logo — large, centered, with sheen */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={handleLogoTap}
        className="cursor-default select-none mb-8 relative z-10"
        aria-label="Swipess logo"
      >
        <div className="relative inline-flex items-center justify-center overflow-hidden">
          <img
            src="/icons/swipess-brand-logo.webp"
            alt="Swipess"
            draggable={false}
            className="h-40 sm:h-48 md:h-56 w-auto object-contain select-none"
            style={{ imageRendering: 'auto' }}
          />
          {/* White sheen overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: sheenActive
                ? 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.45) 55%, transparent 70%)'
                : 'none',
              animation: sheenActive ? 'sheen-sweep 1.2s ease-in-out forwards' : 'none',
              mixBlendMode: 'overlay',
            }}
          />
        </div>
      </motion.div>

      {/* Heading */}
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

      {/* Pulsing status beacon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2.5 mt-6 relative z-10"
      >
        <span className="relative flex h-3 w-3">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-primary/70"
            animate={{
              opacity: [0, 0.7, 0],
              scale: [1, 2.2, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="relative inline-flex h-3 w-3 rounded-full bg-primary"
            animate={{
              opacity: [1, 0.3, 1],
              boxShadow: [
                '0 0 8px 2px hsl(var(--primary) / 0.6)',
                '0 0 2px 0px hsl(var(--primary) / 0.12)',
                '0 0 8px 2px hsl(var(--primary) / 0.6)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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

      {/* Sheen keyframes */}
      <style>{`
        @keyframes sheen-sweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}
