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
  const springPct = useSpring(displayPct, { stiffness: 450, damping: 32, mass: 0.6 });

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

  const _springPctVal = useTransform(springPct, (v) => `${v}%`);
  const _thumbLeft = useTransform(springPct, (v) => `${v}%`);

  return (
    <div className="w-full">
      <div className="relative h-12 flex items-center group">
        <label htmlFor="radius-slider" className="sr-only">Search Radius</label>
        
        {/* Track */}
         <div className="absolute left-[3%] right-[3%] h-2 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
         </div>
        
        {/* Fill */}
        <motion.div
           className="absolute left-[3%] h-2.5 rounded-full z-10"
           style={{ 
             width: useTransform(springPct, [0, 100], ['0%', '94%']),
             background: `linear-gradient(90deg, #ec4899 0%, #f97316 100%)`,
             boxShadow: `0 0 15px rgba(236,72,153,0.3)`
           }}
        >
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
        
        {/* Thumb */}
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
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-80" />
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-10" />
        </motion.div>
      </div>
    </div>
  );
};
