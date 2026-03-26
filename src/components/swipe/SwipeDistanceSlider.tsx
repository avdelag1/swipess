import { useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

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
  const springPct = useSpring(displayPct, { stiffness: 450, damping: 40 });
  const localKmVal = useMotionValue(radiusKm);

  useEffect(() => {
    localKmVal.set(radiusKm);
    displayPct.set((radiusKm / maxKm) * 100);
  }, [radiusKm, displayPct, localKmVal, maxKm]);

  const handleInputChange = (val: number) => {
    localKmVal.set(val);
    displayPct.set((val / maxKm) * 100);
  };

  const springPctVal = useTransform(springPct, (v) => `${v}%`);
  const thumbX = useTransform(springPct, (v) => `${v}%`);
  
  // Transform MotionValue<number> to MotionValue<string> for display
  const displayKmText = useTransform(localKmVal, (v) => `${Math.round(v)} km`);

  return (
    <div className="w-full max-w-xs mx-auto mt-2 px-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#ec4899]" />
          <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">Radius</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span className="text-[13px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#f97316] min-w-[5ch] text-right">
            {displayKmText}
          </motion.span>
          {onDetectLocation && (
            <button
              onClick={onDetectLocation}
              disabled={detecting}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border transition-all active:scale-90",
                detected ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/40"
              )}
            >
              <Navigation className={cn("w-2.5 h-2.5", detecting && "animate-spin")} />
              {detecting ? '…' : detected ? 'GPS' : 'AUTO'}
            </button>
          )}
        </div>
      </div>

      <div className="relative h-10 flex items-center group">
        <div className="absolute w-full h-1.5 rounded-full bg-white/5 border border-white/5" />
        <motion.div
          className="absolute h-1.5 rounded-full bg-gradient-to-r from-[#ec4899] to-[#f97316] shadow-[0_0_20px_rgba(236,72,153,0.4)]"
          style={{ width: springPctVal }}
        />
        <input
          type="range"
          min={1}
          max={maxKm}
          step={1}
          aria-label="Distance Radius"
          title="Adjust search radius"
          defaultValue={radiusKm}
          onChange={(e) => handleInputChange(Number(e.target.value))}
          onMouseUp={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onRadiusChange(Number((e.target as HTMLInputElement).value))}
          className="absolute w-full opacity-0 h-10 cursor-pointer z-30"
          style={{ touchAction: 'none' }}
        />
        <motion.div
          className="absolute w-7 h-7 rounded-full border-[2.5px] border-white shadow-2xl pointer-events-none bg-gradient-to-br from-[#ec4899] to-[#f97316] z-10 flex items-center justify-center after:content-[''] after:w-1 after:h-1 after:bg-white after:rounded-full"
          style={{ 
            x: thumbX,
            left: 'calc(0% - 14px)'
          }}
        />
      </div>

      <div className="flex justify-between mt-0.5 text-white/20 px-0.5">
        <span className="text-[9px] font-black uppercase tracking-widest">MIN</span>
        <span className="text-[9px] font-black uppercase tracking-widest">MAX</span>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
