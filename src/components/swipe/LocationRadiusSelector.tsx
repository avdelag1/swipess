import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigation, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { Navigation, Minus, Plus } from 'lucide-react';

export interface LocationRadiusSelectorProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
  lat?: number | null;
  lng?: number | null;
  variant?: 'full' | 'minimal';
}

const KM_PRESETS = [1, 5, 10, 25, 50, 100];

/**
 * 🛰️ UNIFIED RADAR INTERFACE
 * Replaces the old canvas map with the global DiscoveryMapView engine.
 * Ensures "One Map, One Style" across the entire Swipess ecosystem.
 */
export const LocationRadiusSelector = ({
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected,
  variant = 'full',
}: LocationRadiusSelectorProps) => {
  const [localKm, setLocalKm] = useState(radiusKm);
  
  useEffect(() => { setLocalKm(radiusKm); }, [radiusKm]);

  // Debounce radius update to store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKm !== radiusKm) onRadiusChange(localKm);
    }, 200);
    return () => clearTimeout(timer);
  }, [localKm, radiusKm, onRadiusChange]);

  const handleKmSelect = useCallback((km: number) => {
    triggerHaptic('light');
    setLocalKm(km);
  }, []);

  if (variant === 'minimal') {
    return (
      <div className="w-full flex flex-col gap-2 relative">
        <div 
          className="w-full h-16 rounded-2xl overflow-hidden relative border border-white/10 glass-nano-texture shadow-lg group hover:h-24 transition-all duration-500 cursor-pointer bg-black/40"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
          
          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); onDetectLocation(); }}
                disabled={detecting}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl",
                  detected ? "text-primary border-primary/50" : "text-white/40"
                )}
              >
                <Navigation className={cn("w-4 h-4", detecting && "animate-spin")} />
              </button>
              <div className="bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  Radar <span className="text-primary italic">{localKm}KM</span>
                </span>
              </div>
            </div>
            
            <div className="flex gap-1.5 pointer-events-auto">
               {KM_PRESETS.slice(0, 3).map((km) => (
                  <button
                    key={km}
                    onClick={() => handleKmSelect(km)}
                    className={cn(
                      "h-8 px-3 rounded-xl text-[10px] font-black transition-all border",
                      localKm === km ? "bg-white text-black border-white" : "bg-black/40 backdrop-blur-xl border-white/10 text-white/30"
                    )}
                  >
                    {km}k
                  </button>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full h-full flex flex-col relative bg-black rounded-[2.5rem] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex-1 relative bg-black/40">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-brand-primary-rgb),0.1)_0%,transparent_70%)]" />
         
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black" />

         {/* TOP HUD */}
         <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); triggerHaptic('heavy'); onDetectLocation(); }}
                disabled={detecting}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-2xl backdrop-blur-3xl",
                  detected ? "bg-primary border-primary text-white" : "bg-black/60 border-white/10 text-white/40"
                )}
              >
                <Navigation className={cn("w-5 h-5", detecting && "animate-spin")} />
              </button>
              
              <div className="bg-black/80 backdrop-blur-3xl border border-white/10 px-5 py-2.5 rounded-2xl shadow-2xl">
                 <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                    Detection Radius: <span className="text-primary italic">{localKm}KM</span>
                 </span>
              </div>
            </div>

            {/* PRECISION RANGE SLIDER */}
            <div className="w-full px-2 pointer-events-auto">
               <input 
                 type="range"
                 min="1"
                 max="100"
                 step="1"
                 value={localKm}
                 onChange={(e) => setLocalKm(parseInt(e.target.value))}
                 className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
               />
               <div className="flex justify-between mt-2 px-1">
                  <span className="text-[9px] font-black text-white/20 tracking-tighter">NODE 01</span>
                  <span className="text-[9px] font-black text-white/20 tracking-tighter">MAX 100KM</span>
               </div>
            </div>
         </div>

         {/* BOTTOM PRESETS */}
         <div className="absolute bottom-6 left-6 right-6 z-10 flex gap-3 pointer-events-auto">
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-none bg-black/60 backdrop-blur-3xl border border-white/10 p-2 rounded-[1.5rem] shadow-2xl">
               {KM_PRESETS.map((km) => (
                 <button
                   key={km}
                   onClick={() => handleKmSelect(km)}
                   className={cn(
                     "flex-shrink-0 h-11 min-w-[54px] rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter",
                     localKm === km ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "text-white/40 hover:text-white"
                   )}
                 >
                   {km}km
                 </button>
               ))}
            </div>
            
            <div className="flex flex-col gap-2">
               <button
                 type="button"
                 onClick={() => setLocalKm(Math.min(100, localKm + 5))}
                 className="w-11 h-11 rounded-xl bg-black/60 backdrop-blur-3xl border border-white/10 flex items-center justify-center active:scale-90 text-white hover:border-primary/50 transition-colors"
               >
                 <Plus className="w-4 h-4" />
               </button>
               <button
                 type="button"
                 onClick={() => setLocalKm(Math.max(1, localKm - 5))}
                 className="w-11 h-11 rounded-xl bg-black/60 backdrop-blur-3xl border border-white/10 flex items-center justify-center active:scale-90 text-white hover:border-primary/50 transition-colors"
               >
                 <Minus className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
};
