import { memo, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Users, Star, Circle, X } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import LandingBackgroundEffects from './LandingBackgroundEffects';
import swipessLogo from '@/assets/swipess-logo-transparent.png';

const SWIPE_THRESHOLD = 120;

type EffectMode = 'off' | 'stars' | 'orbs';

function LegendaryLandingPage() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [effectMode, setEffectMode] = useState<EffectMode>('off');
  const isDragging = useRef(false);

  const x = useMotionValue(0);
  const logoOpacity = useTransform(x, [0, 80, 200], [1, 0.6, 0]);
  const logoScale = useTransform(x, [0, 100, 200], [1, 0.95, 0.85]);
  const logoBlur = useTransform(x, [0, 80, 200], [0, 4, 12]);
  const logoFilter = useTransform(logoBlur, (v) => `blur(${v}px)`);

  const openAuthDialog = () => setAuthDialogOpen(true);
  const closeAuthDialog = () => setAuthDialogOpen(false);

  const handleDragStart = () => { isDragging.current = true; };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) openAuthDialog();
    x.set(0);
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleTap = () => {
    if (!isDragging.current) openAuthDialog();
  };

  const cycleEffect = () => {
    setEffectMode((prev) => {
      if (prev === 'off') return 'stars';
      if (prev === 'stars') return 'orbs';
      return 'off';
    });
  };

  const effectLabel = effectMode === 'off' ? 'FX' : effectMode === 'stars' ? '✦' : '◉';

  return (
    <div
      className="h-screen h-dvh flex items-center justify-center relative overflow-hidden"
      style={{ background: '#050505' }}
    >
      {/* Live background effects */}
      <LandingBackgroundEffects mode={effectMode} />

      {/* Centered Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center w-full px-4">
        {/* Swipable Logo - MASSIVE */}
        <motion.div
          data-swipe-logo
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={handleTap}
          style={{ x, opacity: logoOpacity, scale: logoScale, filter: logoFilter }}
          whileTap={{ scale: 0.98 }}
          className="cursor-grab active:cursor-grabbing focus:outline-none touch-none select-none"
        >
          <img
            src={swipessLogo}
            alt="Swipess"
            className="w-[96vw] max-w-[600px] sm:max-w-[680px] md:max-w-[760px] h-auto object-contain rounded-3xl drop-shadow-2xl mx-auto"
          />
        </motion.div>

        {/* Tagline - tight under logo */}
        <motion.p
          className="-mt-4 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <span className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium">
            swipe or tap{' '}
          </span>
          <span
            className="text-3xl sm:text-4xl md:text-5xl font-bold italic"
            style={{
              background: 'linear-gradient(to right, #ff69b4, #ffa500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            to connect
          </span>
        </motion.p>

        {/* Info chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-3"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: Sparkles, label: 'Perfect Deals' },
              { icon: Shield, label: 'Secure Chat' },
              { icon: Users, label: 'Instant Connect' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.12] backdrop-blur-md rounded-full border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
              >
                <Icon className="w-3.5 h-3.5 text-white/90" />
                <span className="text-white/90 text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Effects toggle - bottom left */}
      <motion.button
        onClick={cycleEffect}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.1] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.4)] text-white/80 text-sm font-bold active:bg-white/20 transition-colors"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Toggle background effect"
      >
        {effectLabel}
      </motion.button>

      <AuthDialog isOpen={authDialogOpen} onClose={closeAuthDialog} role="client" />
    </div>
  );
}

export default memo(LegendaryLandingPage);
