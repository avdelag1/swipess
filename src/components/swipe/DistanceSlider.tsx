import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export interface DistanceSliderProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
}

/**
 * DistanceSlider - A custom slider for adjusting the search radius.
 * Features GPS detection integration and a premium gradient track.
 *
 * Uses local state for instant visual feedback — the fill, thumb, and label
 * all move frame-perfectly with the finger. The store/parent is only updated
 * on pointer release so we avoid flooding Zustand on every drag pixel.
 */
export const DistanceSlider = ({ radiusKm, onRadiusChange, onDetectLocation, detecting, detected }: DistanceSliderProps) => {
  const maxKm = 100;
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Local value drives the visual (thumb, fill, label) instantly.
  const [localKm, setLocalKm] = useState(radiusKm);

  // Keep in sync when the parent changes the value externally (e.g. GPS detect).
  useEffect(() => {
    setLocalKm(radiusKm);
  }, [radiusKm]);

  const pct = (localKm / maxKm) * 100;

  return (
    <div className="w-full max-w-xs mx-auto mt-2 px-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Distance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-primary">{localKm} km</span>
          <button
            onClick={onDetectLocation}
            disabled={detecting}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all",
              detected
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-transparent border-muted-foreground/30 text-muted-foreground"
            )}
          >
            <Navigation className={cn("w-2.5 h-2.5", detecting && "animate-pulse")} />
            {detecting ? '...' : detected ? 'GPS' : 'Detect'}
          </button>
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        <label htmlFor="radius-slider" className="sr-only">Search Radius</label>
        <div className="absolute w-full h-1.5 rounded-full overflow-hidden bg-muted/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ec4899] to-[#f97316]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          id="radius-slider"
          type="range"
          min={1}
          max={maxKm}
          step={1}
          value={localKm}
          onChange={(e) => setLocalKm(Number(e.target.value))}
          onMouseUp={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          className="absolute w-full opacity-0 h-6 cursor-pointer touch-none"
          title="Adjust distance radius"
          placeholder="Radius in km"
        />
        {/* Custom thumb — pointer-events:none so the invisible <input> handles all touches */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none bg-gradient-to-br from-[#ec4899] to-[#f97316]"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground font-bold">1 km</span>
        <span className="text-[10px] text-muted-foreground font-bold">100 km</span>
      </div>
    </div>
  );
};
