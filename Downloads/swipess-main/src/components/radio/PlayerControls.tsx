import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSkipBackward?: () => void;
  onSkipForward?: () => void;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  onSkipBackward,
  onSkipForward,
  theme = 'light',
  size = 'md'
}: PlayerControlsProps) {
  const buttonSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 32
  };

  const smallButtonSize = size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  const smallIconSize = iconSizes[size] * 0.7;

  const bgColor = theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20';
  const playBgColor = theme === 'dark' ? 'bg-white/20 hover:bg-white/30' : 'bg-black/20 hover:bg-black/30';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Previous/Skip Backward */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onPrevious}
        className={`${smallButtonSize} rounded-full ${bgColor} ${textColor} flex items-center justify-center backdrop-blur-sm transition-colors`}
        aria-label="Previous station"
      >
        <SkipBack size={smallIconSize} fill="currentColor" />
      </motion.button>

      {/* Skip Backward 10s */}
      {onSkipBackward && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onSkipBackward}
          className={`${smallButtonSize} rounded-full ${bgColor} ${textColor} flex items-center justify-center backdrop-blur-sm transition-colors relative`}
          aria-label="Skip backward 10 seconds"
        >
          <span className="text-xs font-bold absolute">-10</span>
        </motion.button>
      )}

      {/* Play/Pause */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onPlayPause}
        className={`${buttonSizes[size]} rounded-full ${playBgColor} ${textColor} flex items-center justify-center backdrop-blur-sm transition-colors shadow-lg`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause size={iconSizes[size]} fill="currentColor" />
        ) : (
          <Play size={iconSizes[size]} fill="currentColor" className="ml-1" />
        )}
      </motion.button>

      {/* Skip Forward 10s */}
      {onSkipForward && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onSkipForward}
          className={`${smallButtonSize} rounded-full ${bgColor} ${textColor} flex items-center justify-center backdrop-blur-sm transition-colors relative`}
          aria-label="Skip forward 10 seconds"
        >
          <span className="text-xs font-bold absolute">+10</span>
        </motion.button>
      )}

      {/* Next */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onNext}
        className={`${smallButtonSize} rounded-full ${bgColor} ${textColor} flex items-center justify-center backdrop-blur-sm transition-colors`}
        aria-label="Next station"
      >
        <SkipForward size={smallIconSize} fill="currentColor" />
      </motion.button>
    </div>
  );
}
