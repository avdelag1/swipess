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
    <div className="text-center w-full max-w-xs mx-auto px-2">
      <AnimatePresence mode="wait">
        {station ? (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-0.5"
          >
            {/* Station name */}
            <h2 className="text-white text-lg font-bold tracking-tight leading-tight">
              {station.name}
            </h2>

            {/* City & genre */}
            <p className="text-white/40 text-xs leading-tight">
              {cityTheme.name}
              {station.genre && (
                <>
                  <span className="mx-1 text-white/20">·</span>
                  {station.genre}
                </>
              )}
            </p>

            {/* Frequency */}
            <div className="flex items-center justify-center gap-1 pt-0.5">
              <Disc3 className="w-2.5 h-2.5 text-white/25" />
              <span className="text-[9px] text-white/25 font-mono">
                {station.frequency}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-2"
          >
            <p className="text-white/30 text-xs">No station selected</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
