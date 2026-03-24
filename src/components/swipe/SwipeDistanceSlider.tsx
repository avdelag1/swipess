import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface SwipeDistanceSliderProps {
  radiusKm: number;
  onRadiusChange: (val: number) => void;
  onDetectLocation?: () => void;
  detecting?: boolean;
  detected?: boolean;
}

/**
 * SwipeDistanceSlider — same as DistanceSlider but styled for the dark swipe UI.
 *
 * Uses local state for instant visual feedback — fill, thumb, and label all
 * move frame-perfectly with the finger. Store update fires only on pointer
 * release to avoid flooding Zustand on every drag pixel.
 */
export const SwipeDistanceSlider = ({
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected
}: SwipeDistanceSliderProps) => {
  const maxKm = 100;

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
          {onDetectLocation && (
            <button
              onClick={onDetectLocation}
              disabled={detecting}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all"
              style={{
                background: detected ? 'rgba(249,115,22,0.12)' : 'transparent',
                borderColor: detected ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.15)',
                color: detected ? '#f97316' : 'rgba(255,255,255,0.6)',
              }}
            >
              <Navigation className="w-2.5 h-2.5" />
              {detecting ? '...' : detected ? 'GPS' : 'Detect'}
            </button>
          )}
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #ec4899, #f97316)',
            }}
          />
        </div>
        <input
          type="range"
          min={1}
          max={maxKm}
          step={1}
          value={localKm}
          onChange={(e) => setLocalKm(Number(e.target.value))}
          onMouseUp={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          className="absolute w-full opacity-0 h-6 cursor-pointer"
          style={{ touchAction: 'none' }}
        />
        {/* Custom thumb — pointer-events:none so the invisible <input> handles all touches */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `calc(${pct}% - 10px)`,
            background: 'linear-gradient(135deg, #ec4899, #f97316)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground font-bold">1 km</span>
        <span className="text-[10px] text-muted-foreground font-bold">100 km</span>
      </div>
    </div>
  );
};
