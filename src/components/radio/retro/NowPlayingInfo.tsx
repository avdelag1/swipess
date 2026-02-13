import { motion, AnimatePresence } from 'framer-motion';
import { Disc3, Wifi } from 'lucide-react';
import { RadioStation, CityTheme } from '@/types/radio';

interface NowPlayingInfoProps {
  station: RadioStation | null;
  isPlaying: boolean;
  cityTheme: CityTheme;
}

/**
 * Displays the currently playing station info with:
 * - Station name (large, bold)
 * - City / genre subtitle
 * - Live indicator with animated pulse
 * - Frequency display
 * - Smooth transitions between stations
 */
export function NowPlayingInfo({
  station,
  isPlaying,
  cityTheme,
}: NowPlayingInfoProps) {
  return (
    <div className="text-center w-full max-w-xs mx-auto">
      <AnimatePresence mode="wait">
        {station ? (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Live / status indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {isPlaying ? (
                <motion.div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{
                    background: `${cityTheme.primaryColor}20`,
                  }}
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: cityTheme.accentColor }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-[10px] tracking-widest font-medium text-white/60 uppercase">
                    Live
                  </span>
                  <Wifi className="w-3 h-3 text-white/40" />
                </motion.div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <span className="text-[10px] tracking-widest font-medium text-white/40 uppercase">
                    Paused
                  </span>
                </div>
              )}
            </div>

            {/* Station name */}
            <h2 className="text-white text-xl font-bold tracking-tight mb-1">
              {station.name}
            </h2>

            {/* City & genre */}
            <p className="text-white/40 text-sm mb-1">
              {cityTheme.name}
              {station.genre && (
                <>
                  <span className="mx-1.5 text-white/20">·</span>
                  {station.genre}
                </>
              )}
            </p>

            {/* Frequency */}
            <div className="flex items-center justify-center gap-1.5">
              <Disc3 className="w-3 h-3 text-white/25" />
              <span className="text-xs text-white/25 font-mono">
                {station.frequency}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-4"
          >
            <p className="text-white/30 text-sm">No station selected</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
