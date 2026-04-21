/**
 * LIVING RADAR SEARCH EFFECT
 *
 * Smaller, fully round, no frame. Subtle directional light glow on edges.
 * Auto-stops animation after a timeout to save resources.
 */

import { memo, CSSProperties, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

interface RadarSearchEffectProps {
  size?: number;
  color?: string;
  label?: string;
  className?: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  /** Auto-stop animation after this many ms (0 = never stop). Default 6000 */
  autoStopMs?: number;
}

export const RadarSearchEffect = memo(function RadarSearchEffect({
  size = 140,
  color = 'currentColor',
  label,
  className = '',
  isActive = true,
  icon,
  autoStopMs = 6000,
}: RadarSearchEffectProps) {
  const [animating, setAnimating] = useState(isActive);

  // Auto-stop after timeout
  useEffect(() => {
    if (!isActive) { setAnimating(false); return; }
    setAnimating(true);
    if (autoStopMs <= 0) return;
    const t = setTimeout(() => setAnimating(false), autoStopMs);
    return () => clearTimeout(t);
  }, [isActive, autoStopMs]);

  const coreSize = size * 0.42;

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      <div style={containerStyle}>
        {/* Ripple rings */}
        <AnimatePresence>
          {animating && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: [1, 2.8], opacity: [0.15, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: ring * 0.9,
                  }}
                  className="absolute rounded-full border border-primary/20"
                  style={{
                    width: coreSize,
                    height: coreSize,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}

              {/* Sweep beam */}
              <motion.div
                animate={{ rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute rounded-full opacity-30 z-0"
                style={{
                  width: size * 1.0,
                  height: size * 1.0,
                  background: `conic-gradient(from 0deg, ${color} 0%, transparent 20%, transparent 100%)`,
                  maskImage: 'radial-gradient(circle, black 35%, transparent 90%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 35%, transparent 90%)',
                }}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Directional light glow — subtle bright edges instead of a frame */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: coreSize + 16,
            height: coreSize + 16,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'transparent',
            boxShadow: [
              `inset 0 -6px 18px -6px rgba(255,255,255,0.12)`,
              `inset 6px 0 18px -6px rgba(255,255,255,0.06)`,
              `0 8px 30px -8px ${color}25`,
            ].join(', '),
            zIndex: 2,
          }}
        />

        {/* Central core — fully round, no frame */}
        <div
          style={{
            position: 'relative',
            width: coreSize + 8,
            height: coreSize + 8,
            borderRadius: '50%',
            background: animating
              ? `conic-gradient(from 180deg, ${color}40, transparent 60%, ${color}20)`
              : `linear-gradient(135deg, ${color}30, ${color}10)`,
            padding: 2,
            zIndex: 10,
          }}
        >
          <motion.div
            animate={animating ? {
              scale: [1, 1.04, 1],
            } : false}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'rgba(5,5,5,0.97)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Inner glow */}
            {animating && (
              <motion.div
                className="absolute inset-0 z-0"
                animate={{ opacity: [0.08, 0.2, 0.08] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`
                }}
              />
            )}

            <motion.div
              className="relative z-10"
              animate={animating ? {
                y: [0, -2, 0],
                filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
              } : false}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {icon || <User size={Math.round(coreSize * 0.55)} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Label */}
      {label && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/80">
            {animating ? 'Scanning' : 'Ready'}
          </span>
          <span className="text-xs font-medium text-foreground/40 italic">
            {label}
          </span>
        </motion.div>
      )}
    </div>
  );
});

/**
 * Compact radar for inline use
 */
export const RadarSearchIcon = memo(function RadarSearchIcon({
  size = 24,
  color = 'currentColor',
  isActive = true,
  className = '',
}: Omit<RadarSearchEffectProps, 'label'>) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} className={className}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3" />
        <circle cx="12" cy="12" r="6" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
        <circle cx="12" cy="12" r="2" fill={color} />
      </svg>
      {isActive && (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', width: size, height: size, overflow: 'hidden', borderRadius: '50%' }}
        >
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: size / 2, height: size / 2, transformOrigin: '0% 0%',
            background: `conic-gradient(from 0deg, transparent 0%, ${color}50 40%, transparent 100%)`,
          }} />
        </motion.div>
      )}
    </div>
  );
});

