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
  title?: string;
  expanded?: boolean;
  onExpandedChange?: (v: boolean) => void;
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
  lat: _lat,
  lng: _lng,
  variant: _variant = 'minimal',
  nodes = [],
  title,
  expanded: expandedProp,
  onExpandedChange,
}: LocationRadiusSelectorProps) => {
  const { isLight } = useAppTheme();
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isControlled = expandedProp !== undefined;
  const expanded = isControlled ? expandedProp : internalExpanded;

  const toggleExpand = useCallback(() => {
    const next = !expanded;
    if (isControlled) {
      onExpandedChange?.(next);
    } else {
      setInternalExpanded(next);
    }
  }, [expanded, isControlled, onExpandedChange]);

  return (
    <div className="relative flex items-center justify-center gap-2 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
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
              ? cn("bg-primary shadow-[0_0_20px_rgba(236,72,153,0.5)]", isLight ? "text-black" : "text-white")
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

      {/* Expanded Slider Panel — fixed to viewport, full-width below top bar */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{ pointerEvents: 'auto', top: 'calc(var(--top-bar-height, 64px) + var(--safe-top, 0px) + 8px)' }}
            className={cn(
              "fixed left-4 right-4 mx-auto max-w-sm rounded-[2.5rem] border backdrop-blur-3xl p-6 z-[10009] shadow-[0_30px_80px_rgba(0,0,0,0.6)]",
              isLight
                ? "bg-white/95 border-black/10"
                : "bg-[#0d0d0d]/95 border-white/10"
            )}
          >
            <div className="mb-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Sector Depth</h4>
              <p className="text-sm font-black italic opacity-90">{title ? `Scanning for ${title}` : 'Adjust scanning radius'}</p>
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
                onClick={() => isControlled ? onExpandedChange?.(false) : setInternalExpanded(false)}
                className={cn(
                  "w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors",
                  isLight
                    ? "bg-black/5 hover:bg-black/10"
                    : "bg-white/8 hover:bg-white/15"
                )}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

LocationRadiusSelector.displayName = 'LocationRadiusSelector';
