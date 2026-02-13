import { motion } from 'framer-motion';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useRef, useState, useCallback } from 'react';

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

/**
 * Premium volume slider with:
 * - Horizontal track with fill indicator
 * - Draggable thumb with glow effect
 * - Volume icons that change based on level
 * - Touch-friendly (44px touch targets)
 */
export function VolumeSlider({ volume, onVolumeChange }: VolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateVolume = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onVolumeChange(pct);
  }, [onVolumeChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateVolume(e.clientX);
  }, [updateVolume]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    updateVolume(e.clientX);
  }, [isDragging, updateVolume]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
      {/* Volume icon - tappable to mute/unmute */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
        className="p-1 flex-shrink-0"
        aria-label={volume > 0 ? 'Mute' : 'Unmute'}
      >
        <VolumeIcon className="w-4 h-4 text-white/40" />
      </motion.button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex-1 h-10 flex items-center cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volume * 100)}
      >
        <div className="w-full h-1 bg-white/10 rounded-full relative">
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-75"
            style={{
              width: `${volume * 100}%`,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.5))',
            }}
          />

          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white"
            style={{
              left: `calc(${volume * 100}% - 7px)`,
              boxShadow: isDragging
                ? '0 0 12px rgba(255,255,255,0.4), 0 0 4px rgba(255,255,255,0.6)'
                : '0 1px 4px rgba(0,0,0,0.4)',
            }}
            animate={{ scale: isDragging ? 1.2 : 1 }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>

      {/* Percentage */}
      <span className="text-[10px] text-white/30 w-7 text-right flex-shrink-0 font-mono tabular-nums">
        {Math.round(volume * 100)}
      </span>
    </div>
  );
}
