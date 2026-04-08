import { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface SwipeDistanceSliderProps {
  radiusKm: number;
  onRadiusChange: (val: number) => void;
}

export const SwipeDistanceSlider = ({
  radiusKm,
  onRadiusChange,
}: SwipeDistanceSliderProps) => {
  const maxKm = 100;

  // Direct motion value — no spring, zero lag
  const pct = useMotionValue((radiusKm / maxKm) * 100);

  useEffect(() => {
    pct.set((radiusKm / maxKm) * 100);
  }, [radiusKm, pct]);

  const handleInputChange = (val: number) => {
    pct.set((val / maxKm) * 100);
    onRadiusChange(val);
  };

  const fillWidth = useTransform(pct, (v) => `${v}%`);
  const thumbLeft = useTransform(pct, [0, 100], ['3%', '97%']);

  return (
    <div className="relative h-10 flex items-center group">
      {/* Track */}
      <div className="absolute left-[3%] right-[3%] h-2.5 rounded-full bg-secondary/30 border border-border/30 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]">
        {/* Active Fill — instant, no spring */}
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-[hsl(var(--accent-foreground))] relative"
          style={{ width: fillWidth }}
        >
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
        className="absolute left-[3%] right-[3%] opacity-0 h-10 cursor-pointer z-30"
        style={{ touchAction: 'none' }}
      />

      {/* Thumb */}
      <motion.div
        className="absolute w-7 h-7 rounded-full border-2 border-white shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_12px_hsl(var(--primary)/0.3)] pointer-events-none z-20 flex items-center justify-center overflow-hidden"
        style={{
          left: thumbLeft,
          x: '-50%',
          background: `radial-gradient(circle at 35% 35%, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 60%, hsl(var(--accent)) 100%)`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-80" />
        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" />
      </motion.div>
    </div>
  );
};
