import { useState, useEffect, useMemo } from 'react';
import { useFilterStore } from '@/state/filterStore';
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
  const clientType = useFilterStore(s => s.clientType);
  const activeCategory = useFilterStore(s => s.activeCategory);

  // Local value drives the visual (thumb, fill, label) instantly.
  const [localKm, setLocalKm] = useState(radiusKm);
  
  // Motion values for sub-pixel smooth animations
  const displayPct = useMotionValue((radiusKm / maxKm) * 100);
  const springPct = useSpring(displayPct, { stiffness: 450, damping: 32, mass: 0.6 });

  // Keep in sync when the parent changes the value externally (e.g. GPS detect).
  useEffect(() => {
    setLocalKm(radiusKm);
    displayPct.set((radiusKm / maxKm) * 100);
  }, [radiusKm, displayPct]);

  // Use a timeout to debounce the store update to avoid dashboard re-render floods
  // The localKm and displayPct still provide 60fps instant feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKm !== radiusKm) {
        onRadiusChange(localKm);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [localKm, radiusKm, onRadiusChange]);

  const handleInputChange = (val: number) => {
    setLocalKm(val);
    displayPct.set((val / maxKm) * 100);
  };

  const _springPctVal = useTransform(springPct, (v) => `${v}%`);
  const _thumbLeft = useTransform(springPct, (v) => `${v}%`);

  return (
    <motion.div
      className="w-full max-w-xs mx-auto mt-2 px-4 py-2 pointer-events-auto"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div 
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-sm">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1">Scanning</span>
            <span className="text-xs font-black text-primary leading-none uppercase italic tracking-wider">
              {activeCategory === 'all-clients' ? 'Everyone' : 
               activeCategory === 'buyers' ? 'Buyers' : 
               activeCategory === 'renters' ? 'Renters' : 
               activeCategory === 'hire' ? 'Workers' : 
               activeCategory ? activeCategory.replace(/-/g, ' ') : 'Clients'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 shadow-inner">
            <span className="text-sm font-black text-primary tracking-tight">
              {localKm} <span className="text-[10px] opacity-60 italic">km</span>
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDetectLocation}
            disabled={detecting}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all",
              detected
                ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] animate-gps-pulse"
                : "bg-background border-border text-muted-foreground hover:border-primary/50"
            )}
            title="Detect my current GPS location"
          >
            <Navigation className={cn("w-3 h-3", detecting && "animate-spin")} />
            {detecting ? '…' : detected ? 'FIXED' : 'AUTO'}
          </motion.button>
        </div>
      </motion.div>
      
      <motion.div
        className="relative h-12 flex items-center group pointer-events-auto"
        initial={{ opacity: 0, scaleX: 0.7 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'left center', willChange: 'transform' }}
      >
        <label htmlFor="radius-slider" className="sr-only">Search Radius</label>
        
        {/* Track - Pure Glass Morphic with Liquid Highlight */}
         <div className="absolute left-[3%] right-[3%] h-2 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
         </div>
        
        {/* Fill - Left to Right with Glowing Edge */}
        <motion.div
           className="absolute left-[3%] h-2.5 rounded-full z-10"
           style={{ 
             width: useTransform(springPct, [0, 100], ['0%', '94%']),
             background: `linear-gradient(90deg, #ec4899 0%, #f97316 100%)`,
             boxShadow: `0 0 15px rgba(236,72,153,0.3)`
           }}
        >
          {/* Subtle shine on the fill */}
          <div className="absolute inset-x-0 top-0 h-1 bg-white/20 rounded-full" />
        </motion.div>
        
        <input
          id="radius-slider"
          type="range"
          min={1}
          max={maxKm}
          step={1}
          value={localKm}
          onChange={(e) => handleInputChange(Number(e.target.value))}
          className="absolute left-[3%] right-[3%] opacity-0 h-10 cursor-pointer touch-none z-30"
          title="Slide to adjust your search distance"
          aria-label="Search Radius Slider"
        />
        
        {/* Thumb - The "Premium Bowl" - Refined size and depth */}
        <motion.div
          className="absolute w-8 h-8 rounded-full border-[2.5px] border-white shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(236,72,153,0.3)] pointer-events-none z-20 flex items-center justify-center overflow-hidden"
          style={{ 
            left: useTransform(springPct, [0, 100], ['3%', '97%']),
            x: '-50%',
            background: `radial-gradient(circle at 35% 35%, #ec4899 0%, #be185d 40%, #f59e0b 100%)`
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
        >
          {/* Glossy catch-light */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-80" />
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-10" />
        </motion.div>
      </motion.div>
      
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Local</span>
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">100 km+</span>
      </div>
    </motion.div>
  );
};


