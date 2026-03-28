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
    // Real-time update to parent for "instant" feeling as requested by user
    onRadiusChange(val);
  };

  return (
    <div className="w-full max-w-xs mx-auto mt-2 px-4 py-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1">Coverage</span>
            <span className="text-xs font-bold text-foreground leading-none">Search Radius</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div 
            className="px-2 py-1 rounded-md bg-muted/50 border border-border/50"
            animate={{ scale: [1, 1.02, 1] }}
            key={localKm}
            transition={{ duration: 0.1 }}
          >
            <span className="text-sm font-black text-primary tracking-tight">
              {localKm} <span className="text-[10px] opacity-60">km</span>
            </span>
          </motion.div>
          <button
            onClick={onDetectLocation}
            disabled={detecting}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all active:scale-90",
              detected
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-background border-border text-muted-foreground hover:border-primary/50"
            )}
            title="Detect my current GPS location"
          >
            <Navigation className={cn("w-3 h-3", detecting && "animate-spin")} />
            {detecting ? '...' : detected ? 'Fixed' : 'Detect'}
          </button>
        </div>
      </div>
      
      <div className="relative h-10 flex items-center group">
        <label htmlFor="radius-slider" className="sr-only">Search Radius</label>
        
        {/* Living Track background */}
        <div className="absolute w-full h-2 rounded-full bg-muted/30 backdrop-blur-md overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
        </div>
        
        {/* Sentient Progress fill */}
        <motion.div
          className="absolute h-2 rounded-full bg-gradient-to-r from-[#ec4899] to-[#f97316] shadow-[0_0_20px_rgba(236,72,153,0.4)]"
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
          className="absolute w-full opacity-0 h-10 cursor-pointer touch-none z-20"
          title="Slide to adjust your search distance"
        />
        
        {/* Premium Sentient Thumb */}
        <motion.div
          className="absolute w-8 h-8 rounded-2xl border-[3px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] pointer-events-none bg-gradient-to-br from-[#ec4899] to-[#f97316] z-10 flex items-center justify-center overflow-hidden"
          style={{ left: `calc(${(localKm / maxKm) * 100}% - 16px)` }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 5 }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
        </motion.div>
      </div>
      
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Local</span>
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">100 km+</span>
      </div>
    </div>
  );
};
