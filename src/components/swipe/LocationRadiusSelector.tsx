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
    <div className="flex items-center gap-2">
      <motion.div
        layout
        className={cn(
          "flex items-center gap-1 p-1 rounded-full backdrop-blur-3xl border transition-all shadow-2xl",
          isLight
            ? "bg-white/80 border-black/10 shadow-black/5"
            : "bg-black/60 border-white/10 shadow-black/20"
        )}
      >
        {/* GPS QUICK-DETECT */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onDetectLocation}
          disabled={detecting}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-full transition-all",
            detected
              ? "bg-primary text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]"
              : isLight
                ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                : "bg-white/10 text-white hover:bg-white/20"
          )}
          title="Detect GPS location"
        >
          <Navigation className={cn("w-4 h-4", detecting && "animate-spin")} />
        </motion.button>

        {/* RADIUS TOGGLE */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleExpand}
          className={cn(
            "flex items-center gap-2 h-9 px-3 rounded-full transition-all",
            isLight ? "hover:bg-slate-50" : "hover:bg-white/5"
          )}
        >
          <MapPin className={cn(
            "w-3.5 h-3.5",
            detected ? "text-primary" : "opacity-40"
          )} />
          <span className="text-[11px] font-black uppercase italic tracking-wider">
            {radiusKm}<span className="text-[9px] opacity-40 lowercase ml-0.5">km</span>
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <ChevronDown className="w-3 h-3 opacity-30" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Expanded Slider Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              "absolute top-14 right-0 w-72 rounded-[2.5rem] border backdrop-blur-3xl p-5 z-[100] shadow-[0_30px_60px_rgba(0,0,0,0.5)]",
              isLight
                ? "bg-white border-black/5"
                : "bg-[#0a0a0a] border-white/10"
            )}
          >
             <div className="mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Sector Depth</h4>
                <p className="text-xs font-bold italic opacity-80">Adjust scanning radius</p>
             </div>
            <DistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
            <div className="mt-4 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setExpanded(false)}
                  className="w-full py-3 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Close Sensor
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

LocationRadiusSelector.displayName = 'LocationRadiusSelector';
