import { MotionValue, useTransform, motion } from 'framer-motion';
import { memo } from 'react';

interface SwipeOverlaysProps {
  x: MotionValue<number>;
  isPWA?: boolean;
  enableEffects?: boolean;
}

/**
 * SwipeOverlays - Visual feedback during swipe gestures
 *
 * PWA MODE OPTIMIZATIONS:
 * - Disables backdrop blur (expensive in PWA shell)
 * - Disables animated ping effects (continuous animations hurt PWA performance)
 * - Keeps gradient backgrounds for visual feedback
 * - Uses simpler opacity-only transitions
 */
export const SwipeOverlays = memo(function SwipeOverlays({
  x,
  isPWA = false,
  enableEffects = true
}: SwipeOverlaysProps) {
  // PROGRESSIVE visual feedback - matches 120px swipe threshold
  // Overlays fade in gradually: starts appearing at 40px, full at 120px (decision point)
  // This gives users clear feedback on how close they are to committing
  const likeOpacity = useTransform(x, [0, 40, 80, 120], [0, 0.3, 0.6, 1]);
  const passOpacity = useTransform(x, [-120, -80, -40, 0], [1, 0.6, 0.3, 0]);

  // Progressive scale - grows as user approaches threshold
  // Starts subtle, becomes prominent at decision point
  // PWA: Simpler scaling to reduce transform calculations
  const likeScale = useTransform(x, isPWA ? [0, 120] : [0, 60, 120], isPWA ? [0.9, 1.0] : [0.7, 0.9, 1.1]);
  const passScale = useTransform(x, isPWA ? [-120, 0] : [-120, -60, 0], isPWA ? [1.0, 0.9] : [1.1, 0.9, 0.7]);

  // Rotation intensifies progressively with swipe distance
  // PWA: Disable rotation entirely for smoother performance
  const likeRotate = useTransform(x, [0, 60, 120], isPWA ? [0, 0, 0] : [-8, -12, -15]);
  const passRotate = useTransform(x, [-120, -60, 0], isPWA ? [0, 0, 0] : [15, 12, 8]);

  return (
    <>
      {/* Like Overlay (Right Swipe) - IMPERIAL GOLD & JADE - Chinese Luxury */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none swipe-overlay-container like-overlay"
      >
        {/* Imperial gold gradient background - PWA skips blur */}
        <div className={`absolute inset-0 bg-gradient-to-br from-yellow-500/60 via-amber-400/50 to-yellow-600/60 ${
          isPWA ? '' : 'backdrop-blur-[6px]'
        }`} />

        {/* Animated glow rings - DISABLED in PWA mode (expensive continuous animations) */}
        {enableEffects && !isPWA && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-80 h-80 rounded-full bg-yellow-400/25 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-64 h-64 rounded-full bg-amber-500/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
            <div className="absolute w-48 h-48 rounded-full bg-yellow-300/20 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.5s' }} />
          </div>
        )}

        {/* PWA: Simplified static glow instead of animated rings */}
        {isPWA && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-64 h-64 rounded-full bg-yellow-400/30" />
          </div>
        )}

        <motion.div
          className="relative"
          style={{ scale: likeScale, rotate: likeRotate }}
        >
          {/* Imperial gold shiny text with animated effects */}
          <span className="text-8xl swipe-text-liked">
            LIKED
          </span>
        </motion.div>
      </motion.div>

      {/* Pass Overlay (Left Swipe) - CRIMSON CHINESE RED - Luxury */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none swipe-overlay-container pass-overlay"
      >
        {/* Deep crimson gradient background - PWA skips blur */}
        <div className={`absolute inset-0 bg-gradient-to-br from-rose-600/60 via-red-700/55 to-rose-800/60 ${
          isPWA ? '' : 'backdrop-blur-[6px]'
        }`} />

        {/* Animated glow rings - DISABLED in PWA mode (expensive continuous animations) */}
        {enableEffects && !isPWA && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-80 h-80 rounded-full bg-rose-500/25 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-64 h-64 rounded-full bg-red-600/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
            <div className="absolute w-48 h-48 rounded-full bg-rose-400/20 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.5s' }} />
          </div>
        )}

        {/* PWA: Simplified static glow instead of animated rings */}
        {isPWA && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-64 h-64 rounded-full bg-rose-500/30" />
          </div>
        )}

        <motion.div
          className="relative"
          style={{ scale: passScale, rotate: passRotate }}
        >
          {/* Crimson shiny text with animated effects */}
          <span className="text-8xl swipe-text-pass">
            PASS
          </span>
        </motion.div>
      </motion.div>
    </>
  );
});
