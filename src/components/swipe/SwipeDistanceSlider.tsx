import { useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SwipeDistanceSliderProps {
  radiusKm: number;
  onRadiusChange: (val: number) => void;
  onDetectLocation?: () => void;
  detecting?: boolean;
  detected?: boolean;
}

export const SwipeDistanceSlider = ({
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected
}: SwipeDistanceSliderProps) => {
  const maxKm = 100;

  const displayPct = useMotionValue((radiusKm / maxKm) * 100);
  // PERF: Stiffer, lower mass spring for "instant" zero-lag response
  const springPct = useSpring(displayPct, { stiffness: 1000, damping: 40, mass: 0.1 });
  const localKmVal = useMotionValue(radiusKm);

  useEffect(() => {
    localKmVal.set(radiusKm);
    displayPct.set((radiusKm / maxKm) * 100);
  }, [radiusKm, displayPct, localKmVal, maxKm]);

  const handleInputChange = (val: number) => {
    localKmVal.set(val);
    displayPct.set((val / maxKm) * 100);
    // Instant update to parent for "real-time" feeling
    onRadiusChange(val);
  };

  const springPctVal = useTransform(springPct, (v) => `${v}%`);
  const thumbX = useTransform(springPct, (v) => `${v}%`);
  
  // Transform MotionValue<number> to MotionValue<string> for display
  const displayKmText = useTransform(localKmVal, (v) => `${Math.round(v)} km`);

  return (
    <div className="w-full max-w-xs mx-auto mt-2 px-4 py-3 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] leading-none mb-1">Radar Radius</span>
            <span className="text-xs font-bold text-white/90 leading-none">Scanning Range</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div 
            className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 shadow-inner"
            whileHover={{ scale: 1.05 }}
          >
            <motion.span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 min-w-[5ch] text-right">
              {displayKmText}
            </motion.span>
          </motion.div>
          {onDetectLocation && (
            <button
              onClick={onDetectLocation}
              disabled={detecting}
              className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all active:scale-95",
                detected ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
              )}
            >
              <Navigation className={cn("w-3 h-3", detecting && "animate-spin")} />
              {detecting ? '…' : detected ? 'FIX' : 'AUTO'}
            </button>
          )}
        </div>
      </div>

      <div className="relative h-10 flex items-center group">
        {/* Track - Pure Glass Morphic "Hollow" look */}
        <div className="absolute w-full h-2.5 rounded-full bg-white/5 border border-white/10 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
          {/* Active Fill - Vibrant Glow */}
          <motion.div
            className="h-full bg-gradient-to-r from-[#ec4899] to-[#f97316] shadow-[0_0_15px_rgba(236,72,153,0.5)] relative"
            style={{ width: springPctVal }}
          >
             {/* Subtle shine on the fill */}
             <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
          </motion.div>
        </div>
        
        <input
          type="range"
          min={1}
          max={maxKm}
          step={1}
          aria-label="Distance Radius"
          title="Adjust search radius"
          value={radiusKm}
          onChange={(e) => handleInputChange(Number(e.target.value))}
          className="absolute w-full opacity-0 h-10 cursor-pointer z-30"
          style={{ touchAction: 'none' }}
        />
        
        {/* Thumb - The "Little Bowl" circle with premium glow */}
        <motion.div
          className="absolute w-10 h-10 rounded-full border-[3px] border-white/90 shadow-[0_15px_45px_rgba(0,0,0,0.7),0_0_20px_rgba(236,72,153,0.4)] pointer-events-none bg-gradient-to-br from-[#ec4899] to-[#f97316] z-20 flex items-center justify-center"
          style={{ 
            x: thumbX,
            left: 'calc(0% - 20px)'
          }}
          whileTap={{ scale: 0.9, rotate: 0 }}
        >
          {/* Internal reflection & glowing center */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1),0_0_30px_rgba(255,255,255,0.6)] z-10" />
        </motion.div>
      </div>

      <div className="flex justify-between mt-2 px-1 opacity-30">
        <span className="text-[9px] font-black uppercase tracking-[0.4em]">1 KM</span>
        <span className="text-[9px] font-black uppercase tracking-[0.4em]">100 KM+</span>
      </div>
    </div>
  );
};

