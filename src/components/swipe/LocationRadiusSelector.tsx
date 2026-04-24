import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { DistanceSlider } from './DistanceSlider';

interface LocationRadiusSelectorProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
  lat?: number | null;
  lng?: number | null;
  variant?: 'minimal' | 'full';
  nodes?: { id: string; lat: number; lng: number; label: string }[];
}

/**
 * 🛰️ LOCATION RADIUS SELECTOR — Compact Glass Pill
 *
 * Minimal HUD element showing current search radius with GPS detect.
 * Expands into a DistanceSlider on tap for radius adjustment.
 * Replaces the legacy radar/map implementation (cards-only paradigm).
 */
export const LocationRadiusSelector = memo(({
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected,
  lat,
  lng,
  variant = 'minimal',
  nodes = [],
}: LocationRadiusSelectorProps) => {
  const { isLight } = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const nearbyCount = nodes.length;

  return (
    <div className="relative flex flex-col items-end gap-2">
      {/* Compact Pill — Always visible */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggleExpand}
        className={cn(
          "flex items-center gap-2 h-10 px-3.5 rounded-full backdrop-blur-xl border transition-all",
          isLight
            ? "bg-white/80 border-black/20 text-black shadow-md"
            : "bg-black/80 border-white/40 text-white shadow-xl"
        )}
      >
        <MapPin className={cn(
          "w-4 h-4 transition-colors",
          detected ? "text-primary" : "text-current"
        )} />
        <span className="text-[11px] font-black uppercase tracking-wider">
          {radiusKm} <span className="text-[9px] opacity-50 italic">km</span>
        </span>
        {nearbyCount > 0 && (
          <span className={cn(
            "text-[9px] font-black px-1.5 py-0.5 rounded-full",
            isLight ? "bg-primary/10 text-primary" : "bg-primary/20 text-primary"
          )}>
            {nearbyCount}
          </span>
        )}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <ChevronDown className="w-3 h-3 opacity-40" />
        </motion.div>
      </motion.button>

      {/* GPS Quick-Detect */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onDetectLocation}
        disabled={detecting}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-xl border transition-all",
          detected
            ? "bg-primary/30 border-primary/40 text-primary shadow-[0_0_15px_rgba(236,72,153,0.3)]"
            : isLight
              ? "bg-white/80 border-black/20 text-black/90"
              : "bg-black/80 border-white/40 text-white/95"
        )}
        title="Detect GPS location"
      >
        <Navigation className={cn("w-4 h-4", detecting && "animate-spin")} />
      </motion.button>

      {/* Expanded Slider Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              "absolute top-12 right-0 w-72 rounded-3xl border backdrop-blur-3xl p-4 z-50 shadow-2xl",
              isLight
                ? "bg-white/90 border-black/5"
                : "bg-black/90 border-white/10"
            )}
          >
            <DistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

LocationRadiusSelector.displayName = 'LocationRadiusSelector';
