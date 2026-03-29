import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

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
  const springPct = useSpring(displayPct, { stiffness: 500, damping: 30, mass: 0.5 });

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

  const springPctVal = useTransform(springPct, (v) => `${v}%`);
  // Thumb is w-9 = 36px. Offset must scale with v so the center tracks exactly:
  // at v=0 → left=0, at v=50 → left=calc(50%-18px), at v=100 → left=calc(100%-36px)
  const thumbLeft = useTransform(springPct, (v) => `calc(${v}% - ${v * 0.36}px)`);

  return (
    <div className="w-full max-w-xs mx-auto mt-2 px-4 py-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-sm">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1">Coverage</span>
            <span className="text-xs font-bold text-foreground leading-none">Search Radius</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div 
            className="px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 shadow-inner"
            animate={{ scale: [1, 1.05, 1] }}
            key={localKm}
            transition={{ duration: 0.1 }}
          >
            <span className="text-sm font-black text-primary tracking-tight">
              {localKm} <span className="text-[10px] opacity-60 italic">km</span>
            </span>
          </motion.div>
          <button
            onClick={onDetectLocation}
            disabled={detecting}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all active:scale-95",
              detected
                ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                : "bg-background border-border text-muted-foreground hover:border-primary/50"
            )}
            title="Detect my current GPS location"
          >
            <Navigation className={cn("w-3 h-3", detecting && "animate-spin")} />
            {detecting ? '…' : detected ? 'FIXED' : 'AUTO'}
          </button>
        </div>
      </div>
      
      <div className="relative h-12 flex items-center group">
        <label htmlFor="radius-slider" className="sr-only">Search Radius</label>
        
        {/* Track - Pure Glass Morphic with Liquid Highlight */}
        <div className="absolute w-full h-2 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
           {/* Animated liquid shimmer on the track */}
           <motion.div 
             animate={{ x: ['-100%', '200%'] }}
             transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
             className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
           />
        </div>
        
        {/* Fill - Left to Right with Glowing Edge */}
        <motion.div
          className="absolute h-2 rounded-full z-10"
          style={{ 
            width: springPctVal,
            background: `linear-gradient(90deg, #ec4899 0%, #f97316 100%)`,
            boxShadow: `0 0 20px rgba(236,72,153,0.4), 0 0 40px rgba(249,115,22,0.2)`
          }}
        >
          {/* Glowing tip of the fill */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white blur-sm opacity-60" />
        </motion.div>
        
        <input
          id="radius-slider"
          type="range"
          min={1}
          max={maxKm}
          step={1}
          value={localKm}
          onChange={(e) => handleInputChange(Number(e.target.value))}
          className="absolute w-full opacity-0 h-10 cursor-pointer touch-none z-30"
          title="Slide to adjust your search distance"
          aria-label="Search Radius Slider"
        />
        
        {/* Thumb - The "Little Bowl" - High-Fidelity Design */}
        <motion.div
          className="absolute w-9 h-9 rounded-full border-[2.5px] border-white shadow-[0_12px_24px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] pointer-events-none z-20 flex items-center justify-center overflow-hidden"
          style={{ 
            left: thumbLeft,
            background: `radial-gradient(circle at 30% 30%, #ec4899 0%, #d946ef 45%, #f97316 100%)`
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8, rotate: -5 }}
        >
          {/* Inner "Bowl" Shadow Depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.25)_100%)]" />
          {/* Catch-light */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-white/30 rounded-full blur-[1px]" />
          {/* Core glow */}
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)]" />
        </motion.div>
      </div>
      
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Local</span>
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">100 km+</span>
      </div>
    </div>
  );
};
