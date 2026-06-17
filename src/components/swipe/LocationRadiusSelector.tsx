import { memo, useCallback, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MapPin, Navigation } from 'lucide-react';
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
  orientation?: 'horizontal' | 'vertical';
  /** `map` raises z-index and anchors the slider panel above the floater. */
  surface?: 'dashboard' | 'map';
  /** Slim single-row pill for map HUD (avoids overlapping city strip). */
  compact?: boolean;
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
  nodes: _nodes = [],
  title,
  expanded: expandedProp,
  onExpandedChange,
  orientation = 'horizontal',
  surface = 'dashboard',
  compact = false,
}: LocationRadiusSelectorProps) => {
  const { isLight } = useAppTheme();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isMap = surface === 'map';
  const isMapCompact = isMap && compact;

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

  const closePanel = useCallback(() => {
    if (isControlled) onExpandedChange?.(false);
    else setInternalExpanded(false);
  }, [isControlled, onExpandedChange]);

  const panelStyle: CSSProperties = isMapCompact
    ? { pointerEvents: 'auto' }
    : isMap
      ? {
          pointerEvents: 'auto',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
        }
      : {
          pointerEvents: 'auto',
          top: 'calc(var(--top-bar-height, 64px) + var(--safe-top, 0px) + 8px)',
        };

  const panelClass = cn(
    isMapCompact
      ? 'absolute bottom-full left-0 mb-2 w-[min(280px,calc(100vw-2rem))] rounded-2xl border p-4 shadow-[0_16px_48px_rgba(0,0,0,0.65)] z-[10030] bg-[#12161f] border-white/12 text-white'
      : cn(
          'rounded-[2.5rem] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.72)]',
          isMap
            // Solid, fully-opaque panel — the live map must NOT bleed through the radius window.
            ? 'fixed left-4 right-4 mx-auto max-w-sm z-[10030] bg-[#12161f] border-white/12 text-white'
            : cn('fixed left-4 right-4 mx-auto max-w-sm z-[10009] chrome-solid', isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0d0d0d]/95 border-white/10'),
        ),
  );

  const renderExpandedPanel = () => (
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: isMap ? 12 : -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMap ? 12 : -10, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          style={panelStyle}
          className={panelClass}
        >
          {!isMapCompact && (
            <div className="mb-5">
              <h4 className={cn('text-[10px] font-black uppercase tracking-[0.3em] mb-1', isMap ? 'text-white/40' : 'opacity-40')}>
                Search Radius
              </h4>
              <p className={cn('text-sm font-black italic', isMap ? 'text-white/90' : 'opacity-90')}>
                {title ? `Searching ${title}` : 'Adjust search distance'}
              </p>
            </div>
          )}
          {isMapCompact && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/45 mb-3">Search radius</p>
          )}
          <DistanceSlider
            radiusKm={radiusKm}
            onRadiusChange={onRadiusChange}
            onDetectLocation={onDetectLocation}
            detecting={detecting}
            detected={detected}
            onDark={isMap}
          />
          <div className={cn('mt-5 pt-5 border-t', isMap ? 'border-white/10' : isLight ? 'border-slate-200' : 'border-white/10')}>
            <button
              type="button"
              data-skip-press-engine
              onClick={closePanel}
              className={cn(
                'tap-css-only w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors',
                isMap ? 'bg-white/10 hover:bg-white/15 text-white' : isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/8 hover:bg-white/15',
              )}
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col items-center gap-2 w-[52px]" style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          data-skip-press-engine
          onClick={toggleExpand}
          className={cn(
            "w-[52px] h-[52px] flex flex-col items-center justify-center rounded-full border shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
            "deck-hud-solid border-white/20 text-white gap-0.5 tap-css-only"
          )}
        >
          <MapPin className="w-5 h-5 opacity-90" strokeWidth={2.2} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{radiusKm}km</span>
        </button>
        
        {renderExpandedPanel()}
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center gap-2 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
      <div
        style={{ pointerEvents: 'auto' }}
        className={cn(
          'flex items-center transition-transform flex-row rounded-full border shadow-[0_6px_20px_rgba(0,0,0,0.5)]',
          isMapCompact ? 'gap-1 px-1 py-0.5 h-8 bg-[#161b27]/95 border-white/12' : 'gap-2 p-2',
          !isMapCompact && (isMap
            ? 'bg-[#161b27]/95 border-white/14'
            : cn('glass-pill chrome-solid', isLight ? 'glass-light-surface' : 'glass-dark')),
        )}
      >
        {/* GPS QUICK-DETECT */}
        <button
          type="button"
          data-skip-press-engine
          onClick={onDetectLocation}
          disabled={detecting}
          style={{ pointerEvents: 'auto' }}
          className={cn(
            'tap-css-only flex items-center justify-center rounded-full flex-shrink-0',
            isMapCompact ? 'w-7 h-7' : 'w-10 h-10',
            detected
              ? isMap
                ? 'bg-[#00C6FF]/25 text-[#00C6FF] shadow-[0_0_16px_rgba(0,198,255,0.35)]'
                : cn('bg-primary shadow-[0_0_20px_rgba(236,72,153,0.5)]', isLight ? 'text-black' : 'text-white')
              : isMap
                ? 'bg-white/10 text-white/80 hover:bg-white/15'
                : isLight
                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  : 'bg-white/15 text-white hover:bg-white/25',
          )}
          title="Detect GPS location"
        >
          <Navigation className={cn(isMapCompact ? 'w-3 h-3' : 'w-4 h-4', detecting && 'animate-spin')} />
        </button>

        {/* RADIUS TOGGLE */}
        <button
          type="button"
          data-skip-press-engine
          onClick={toggleExpand}
          style={{ pointerEvents: 'auto' }}
          className={cn(
            'tap-css-only flex items-center rounded-full flex-shrink-0',
            isMapCompact ? 'gap-1 h-7 px-2' : 'gap-2 h-10 px-4',
            isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10',
          )}
        >
          {!isMapCompact && (
            <MapPin className={cn(
              'w-4 h-4',
              detected ? (isMap ? 'text-[#00C6FF]' : 'text-primary') : 'opacity-50',
            )} />
          )}
          <span className={cn(
            'font-black uppercase tracking-wider',
            isMapCompact ? 'text-[10px] text-white' : 'text-[12px] italic',
            isMap && !isMapCompact && 'text-white',
          )}>
            <span className={isMap ? 'text-[#00C6FF]' : undefined}>{radiusKm}</span>
            <span className={cn('opacity-50 lowercase', isMapCompact ? 'text-[8px] ml-0.5' : 'text-[10px] ml-1')}>km</span>
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <ChevronDown className={cn(isMapCompact ? 'w-2.5 h-2.5' : 'w-3 h-3', 'opacity-30')} />
          </motion.div>
        </button>
      </div>

      {renderExpandedPanel()}
    </div>
  );
});

LocationRadiusSelector.displayName = 'LocationRadiusSelector';
