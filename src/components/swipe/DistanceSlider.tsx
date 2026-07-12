import { useEffect, useState } from 'react';
import { useFilterStore } from '@/state/filterStore';
import { Crosshair, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';

export interface DistanceSliderProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
  /** Force light-on-dark text/controls — for the always-dark map radius window. */
  onDark?: boolean;
}

/**
 * DistanceSlider - A custom slider for adjusting the search radius.
 * Features GPS detection integration and a premium gradient track.
 *
 * Uses local state and Framer Motion for instant visual feedback.
 * The store/parent is only updated on pointer release to avoid flooding Zustand.
 */
export const DistanceSlider = ({ radiusKm, onRadiusChange, onDetectLocation, detecting, detected, onDark = false }: DistanceSliderProps) => {
  const { isLight } = useAppTheme();
  // The map radius window is a solid dark surface in every theme, so its text/controls
  // must stay light regardless of the user's chosen app theme.
  const dark = onDark || !isLight;
  const activeCategory = useFilterStore(s => s.activeCategory);

  // Discrete precise steps to prevent inaccurate selections
  const KM_STEPS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  const maxStep = KM_STEPS.length - 1;

  // Find nearest step index for the incoming radiusKm
  const getStepIndex = (km: number) => {
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < KM_STEPS.length; i++) {
      const diff = Math.abs(KM_STEPS[i] - km);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  };

  // Local value drives the visual (thumb, fill, label) instantly.
  const [localStep, setLocalStep] = useState(() => getStepIndex(radiusKm));
  const localKm = KM_STEPS[localStep];
  
  // Motion values for sub-pixel smooth animations
  const displayPct = useMotionValue((localStep / maxStep) * 100);
  const springPct = useSpring(displayPct, { stiffness: 450, damping: 32, mass: 0.6 });

  // Keep in sync when the parent changes the value externally (e.g. GPS detect).
  useEffect(() => {
    const step = getStepIndex(radiusKm);
    setLocalStep(step);
    displayPct.set((step / maxStep) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm, displayPct]);

  const commitRadius = (valStep: number) => {
    const km = KM_STEPS[valStep];
    if (km !== radiusKm) onRadiusChange(km);
  };

  const handleInputChange = (valStep: number) => {
    setLocalStep(valStep);
    displayPct.set((valStep / maxStep) * 100);
  };

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
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onDetectLocation();
              handleInputChange(3);
              onRadiusChange(3);
            }}
            disabled={detecting}
            aria-label="Detect my location"
            aria-pressed={detected}
            className={cn(
              "relative w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 border",
              dark
                ? "bg-white/[0.04] border-white/10 backdrop-blur-xl hover:bg-white/[0.08]"
                : "bg-white border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]",
              detected && "ring-2 ring-primary/40"
            )}
          >
            {detecting ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : detected ? (
              <Crosshair className="w-4 h-4 text-primary" />
            ) : (
              <MapPin className={cn("w-4 h-4", dark ? "text-primary" : "text-black/70")} />
            )}
            {detected && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
            )}
          </button>
          <div className="flex flex-col">
            <span style={{ color: dark ? 'rgba(255,255,255,0.55)' : undefined }} className={cn("text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1", !dark && "text-muted-foreground")}>Scanning</span>
            <span className="text-xs font-black text-primary leading-none uppercase italic tracking-wider">
              {activeCategory === 'all-clients' ? 'Everyone' :
               activeCategory === 'buyers' ? 'Buyers' :
               activeCategory === 'renters' ? 'Renters' :
               activeCategory === 'hire' ? 'Workers' :
               activeCategory ? activeCategory.replace(/-/g, ' ') : 'Properties'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full flex items-center justify-center">
            <span style={{ color: dark ? undefined : '#000000' }} className={cn("text-sm font-black tracking-tight", dark && "text-primary")}>
              {localKm} <span className="text-[10px] opacity-60 italic">km</span>
            </span>
          </div>
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
         <div
           className={cn(
             "absolute left-[3%] right-[3%] h-2 rounded-full overflow-hidden",
             dark
               ? "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
               : "bg-black/[0.06] border border-black/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]"
           )}
         >
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
          min={0}
          max={maxStep}
          step={1}
          value={localStep}
          onChange={(e) => handleInputChange(Number(e.target.value))}
          onPointerUp={() => commitRadius(localStep)}
          onTouchEnd={() => commitRadius(localStep)}
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
        <span style={{ color: dark ? 'rgba(255,255,255,0.4)' : undefined }} className={cn("text-[9px] font-bold uppercase tracking-[0.3em]", !dark && "text-muted-foreground/60")}>Local</span>
        <span style={{ color: dark ? 'rgba(255,255,255,0.4)' : undefined }} className={cn("text-[9px] font-bold uppercase tracking-[0.3em]", !dark && "text-muted-foreground/60")}>100 km+</span>
      </div>
    </motion.div>
  );
};


