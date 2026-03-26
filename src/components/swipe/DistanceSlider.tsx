import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { motion, useSpring, useMotionValue } from 'framer-motion';

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
 * Uses local state and Framer Motion for instant visual feedback.
 * The store/parent is only updated on pointer release to avoid flooding Zustand.
 */
export const DistanceSlider = ({ radiusKm, onRadiusChange, onDetectLocation, detecting, detected }: DistanceSliderProps) => {
  const maxKm = 100;
  
  // Local value drives the visual (thumb, fill, label) instantly.
  const [localKm, setLocalKm] = useState(radiusKm);
  
  // Motion values for sub-pixel smooth animations
  const displayPct = useMotionValue((radiusKm / maxKm) * 100);
  const springPct = useSpring(displayPct, { stiffness: 450, damping: 40 });

  // Keep in sync when the parent changes the value externally (e.g. GPS detect).
  useEffect(() => {
    setLocalKm(radiusKm);
    displayPct.set((radiusKm / maxKm) * 100);
  }, [radiusKm, displayPct]);

  const handleInputChange = (val: number) => {
    setLocalKm(val);
    displayPct.set((val / maxKm) * 100);
  };

  return (
    <div className="w-full max-w-xs mx-auto mt-2 px-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Distance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span 
            className="text-xs font-black text-primary min-w-[3ch] text-right"
            animate={{ scale: [1, 1.1, 1] }}
            key={localKm}
            transition={{ duration: 0.1 }}
          >
            {localKm} km
          </motion.span>
          <button
            onClick={onDetectLocation}
            disabled={detecting}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border transition-all active:scale-95",
              detected
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-transparent border-muted-foreground/30 text-muted-foreground"
            )}
          >
            <Navigation className={cn("w-2.5 h-2.5", detecting && "animate-spin")} />
            {detecting ? '...' : detected ? 'GPS' : 'Detect'}
          </button>
        </div>
      </div>
      
      <div className="relative h-8 flex items-center group">
        <label htmlFor="radius-slider" className="sr-only">Search Radius</label>
        
        {/* Track background */}
        <div className="absolute w-full h-2 rounded-full overflow-hidden bg-muted/40 backdrop-blur-sm shadow-inner" />
        
        {/* Progress fill */}
        <motion.div
          className="absolute h-2 rounded-full bg-gradient-to-r from-[#ec4899] to-[#f97316] shadow-[0_0_15px_rgba(236,72,153,0.3)]"
          style={{ width: springPct.get() + '%' }}
        />
        
        <input
          id="radius-slider"
          type="range"
          min={1}
          max={maxKm}
          step={1}
          value={localKm}
          onChange={(e) => handleInputChange(Number(e.target.value))}
          onMouseUp={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          className="absolute w-full opacity-0 h-8 cursor-pointer touch-none z-20"
          title="Adjust distance radius"
        />
        
        {/* Thumb position calc */}
        <div
          className="absolute w-6 h-6 rounded-full border-[3px] border-white shadow-xl pointer-events-none bg-gradient-to-br from-[#ec4899] to-[#f97316] z-10"
          style={{ left: `calc(${(localKm / maxKm) * 100}% - 12px)` }}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-muted-foreground/60 px-1">
        <span className="text-[10px] font-black uppercase tracking-widest">1 km</span>
        <span className="text-[10px] font-black uppercase tracking-widest">100 km</span>
      </div>
    </div>
  );
};
