import { memo, useState, useCallback, useEffect } from 'react';
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
    <div className="relative flex items-center gap-2 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
      <motion.div
        layout
        style={{ pointerEvents: 'auto' }}
        className={cn(
          "flex items-center gap-2 p-2 rounded-full backdrop-blur-3xl border transition-all shadow-2xl",
          isLight
            ? "bg-white/85 border-black/10 shadow-black/10"
            : "bg-black/70 border-white/15 shadow-black/30"
        )}
      >
        {/* GPS QUICK-DETECT */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onDetectLocation}
          disabled={detecting}
          style={{ pointerEvents: 'auto' }}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0",
            detected
              ? "bg-primary text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]"
              : isLight
                ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                : "bg-white/15 text-white hover:bg-white/25"
          )}
          title="Detect GPS location"
        >
          <Navigation className={cn("w-4 h-4", detecting && "animate-spin")} />
        </motion.button>

        {/* RADIUS TOGGLE */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={toggleExpand}
          style={{ pointerEvents: 'auto' }}
          className={cn(
            "flex items-center gap-2 h-10 px-4 rounded-full transition-all flex-shrink-0",
            isLight ? "hover:bg-slate-100" : "hover:bg-white/10"
          )}
        >
          <MapPin className={cn(
            "w-4 h-4",
            detected ? "text-primary" : "opacity-50"
          )} />
          <span className="text-[12px] font-black uppercase italic tracking-wider">
            {radiusKm}<span className="text-[10px] opacity-50 lowercase ml-1">km</span>
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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ pointerEvents: 'auto' }}
            className={cn(
              "absolute top-16 right-0 w-80 rounded-[2.5rem] border backdrop-blur-3xl p-6 z-[100] shadow-[0_30px_60px_rgba(0,0,0,0.5)]",
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
            <div className={cn("mt-5 pt-5 border-t", isLight ? "border-black/10" : "border-white/10")}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExpanded(false)}
                  className={cn(
                    "w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors",
                    isLight
                      ? "bg-black/5 hover:bg-black/10"
                      : "bg-white/8 hover:bg-white/15"
                  )}
                >
                  Close Sensor
                </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

LocationRadiusSelector.displayName = 'LocationRadiusSelector';
