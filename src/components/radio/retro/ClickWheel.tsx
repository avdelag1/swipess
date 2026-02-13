import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useCallback, useRef } from 'react';

interface ClickWheelProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onMenuPress: () => void;
  /** Visual style variant */
  variant?: 'classic' | 'dark';
  size?: number;
}

/**
 * iPod Classic-inspired click wheel with:
 * - Circular touch areas for menu/prev/next/play-pause
 * - Center select button
 * - Haptic-style press feedback
 * - Neomorphic shadow effects
 */
export function ClickWheel({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  onMenuPress,
  variant = 'classic',
  size = 200,
}: ClickWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);

  const isDark = variant === 'dark';
  const wheelBg = isDark
    ? 'bg-gradient-to-b from-gray-800 to-gray-900'
    : 'bg-gradient-to-b from-gray-200 to-gray-350';
  const centerBg = isDark
    ? 'bg-gradient-to-b from-gray-700 to-gray-800'
    : 'bg-gradient-to-b from-gray-100 to-gray-300';
  const textColor = isDark ? 'text-gray-300' : 'text-gray-600';
  const iconColor = isDark ? 'text-gray-300' : 'text-gray-600';
  const wheelShadow = isDark
    ? '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
    : '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)';
  const centerShadow = isDark
    ? '0 2px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
    : '0 2px 10px rgba(0,0,0,0.1), inset 0 -1px 0 rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)';

  const centerSize = size * 0.34;
  const iconSize = Math.max(12, size * 0.08);
  const menuFontSize = Math.max(8, size * 0.055);

  const handlePress = useCallback((callback: () => void) => {
    // Trigger haptic if available (Capacitor)
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch { /* noop */ }
    callback();
  }, []);

  return (
    <div
      ref={wheelRef}
      className="relative select-none"
      style={{ width: size, height: size }}
      role="group"
      aria-label="Playback controls"
    >
      {/* Outer wheel ring */}
      <div
        className={`absolute inset-0 rounded-full ${wheelBg}`}
        style={{ boxShadow: wheelShadow }}
      >
        {/* Subtle ring detail */}
        <div
          className="absolute inset-[2px] rounded-full pointer-events-none"
          style={{
            border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)',
          }}
        />
      </div>

      {/* MENU - Top */}
      <motion.button
        whileTap={{ scale: 0.92, opacity: 0.7 }}
        onClick={() => handlePress(onMenuPress)}
        className={`absolute flex items-center justify-center ${textColor} font-bold uppercase tracking-widest z-10`}
        style={{
          top: size * 0.06,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.3,
          height: size * 0.15,
          fontSize: menuFontSize,
        }}
        aria-label="Open station menu"
      >
        MENU
      </motion.button>

      {/* Previous - Left */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handlePress(onPrevious)}
        className={`absolute flex items-center justify-center z-10 ${iconColor}`}
        style={{
          left: size * 0.06,
          top: '50%',
          transform: 'translateY(-50%)',
          width: size * 0.16,
          height: size * 0.2,
        }}
        aria-label="Previous station"
      >
        <SkipBack size={iconSize} fill="currentColor" />
      </motion.button>

      {/* Next - Right */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handlePress(onNext)}
        className={`absolute flex items-center justify-center z-10 ${iconColor}`}
        style={{
          right: size * 0.06,
          top: '50%',
          transform: 'translateY(-50%)',
          width: size * 0.16,
          height: size * 0.2,
        }}
        aria-label="Next station"
      >
        <SkipForward size={iconSize} fill="currentColor" />
      </motion.button>

      {/* Play/Pause - Bottom */}
      <motion.button
        whileTap={{ scale: 0.92, opacity: 0.7 }}
        onClick={() => handlePress(onPlayPause)}
        className={`absolute flex items-center justify-center z-10 ${iconColor}`}
        style={{
          bottom: size * 0.06,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.3,
          height: size * 0.15,
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause size={iconSize} fill="currentColor" />
        ) : (
          <Play size={iconSize} fill="currentColor" className="ml-0.5" />
        )}
      </motion.button>

      {/* Center Select Button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => handlePress(onPlayPause)}
        className={`absolute rounded-full ${centerBg} z-20`}
        style={{
          width: centerSize,
          height: centerSize,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: centerShadow,
        }}
        aria-label="Select"
      >
        {/* Inner subtle ring */}
        <div
          className="absolute inset-[3px] rounded-full pointer-events-none"
          style={{
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.6)',
          }}
        />
      </motion.button>
    </div>
  );
}
