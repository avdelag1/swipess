/**
 * LIVING RADAR SEARCH EFFECT
 *
 * Subtle, organic, constantly-moving radar that feels alive.
 * Like a gentle heartbeat or breathing - always in motion.
 *
 * Features:
 * - Continuous gentle ripple waves
 * - Soft rotating sweep (subtle, not intense)
 * - Breathing center dot (like a living organism)
 * - Multiple motion speeds for organic feel
 * - Subtle glows and soft transitions
 * - ALWAYS moving - never static
 * - GPU-accelerated
 */

import { memo, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

interface RadarSearchEffectProps {
  /** Size in pixels (default 120) */
  size?: number;
  /** Primary color (default: currentColor) */
  color?: string;
  /** Show label text below the radar */
  label?: string;
  /** Additional className */
  className?: string;
  /** Whether animation is active (default true) */
  isActive?: boolean;
  /** Custom icon to display in the absolute center of the radar */
  icon?: React.ReactNode;
}

/**
 * Radar Search Effect Component
 *
 * Renders a subtle, living radar that's constantly in gentle motion.
 * Feels organic and alive without being dramatic or distracting.
 */
export const RadarSearchEffect = memo(function RadarSearchEffect({
  size = 180,
  color = 'currentColor',
  label,
  className = '',
  isActive = true,
  icon,
}: RadarSearchEffectProps) {
  const centerSize = size * 0.45; // Much larger central hub

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className={`flex flex-col items-center gap-8 ${className}`}>
      <div style={containerStyle}>
        {/* SENTIENT DISCOVERY ENGINE - Layered Ripple System */}
        <AnimatePresence>
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 1, 2, 3, 4].map((ring) => (
                <motion.div
                  key={ring}
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{
                    scale: [1, 5],
                    opacity: [0.35, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: [0.1, 0, 0, 1],
                    delay: ring * 0.55,
                  }}
                  className="absolute rounded-full border border-primary/40 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
                  style={{
                    width: centerSize,
                    height: centerSize,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
              
              {/* High-Tech Sweep Beam */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute rounded-full opacity-40 z-0"
                style={{
                  width: size * 1.2,
                  height: size * 1.2,
                  background: `conic-gradient(from 0deg, ${color} 0%, transparent 25%, transparent 100%)`,
                  maskImage: 'radial-gradient(circle, black 40%, transparent 95%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 95%)',
                }}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Outer Static Frame Ring */}
        <div
          style={{
            position: 'absolute',
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: '50%',
            border: `1px solid ${color}15`,
            boxShadow: `inset 0 0 40px ${color}05`,
            zIndex: 1,
          }}
        />

        {/* Central Core - The 'User' Hub */}
        <div
          style={{
            position: 'relative',
            width: centerSize + 12,
            height: centerSize + 12,
            borderRadius: '2.5rem',
            background: isActive 
              ? `conic-gradient(from 0deg, #ec4899, #f97316, #fbbf24, #ec4899)` 
              : `linear-gradient(135deg, ${color}80, ${color}20)`,
            padding: 2,
            zIndex: 10,
            boxShadow: isActive ? `0 0 50px ${color}40` : 'none',
          }}
        >
          <motion.div
            animate={isActive ? {
              scale: [1, 1.05, 1],
              backgroundColor: ['rgba(0,0,0,0.95)', 'rgba(20,20,20,0.95)', 'rgba(0,0,0,0.95)'],
            } : { scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '2.4rem',
              backgroundColor: 'rgba(0,0,0,0.98)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Core sentient pulse */}
            {isActive && (
              <motion.div
                className="absolute inset-0 z-0"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`
                }}
              />
            )}

            <motion.div
              className="relative z-10 scale-[1.3]"
              animate={isActive ? {
                y: [0, -3, 0],
                filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
              } : { y: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {icon || <User size={40} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Modern Subtext */}
      {label && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">
            {isActive ? 'Scanning Network' : 'Ready'}
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
 * Compact radar for inline use (e.g., in buttons)
 */
export const RadarSearchIcon = memo(function RadarSearchIcon({
  size = 24,
  color = 'currentColor',
  isActive = true,
  className = '',
}: Omit<RadarSearchEffectProps, 'label'>) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ position: 'absolute' }}
      >
        {/* Outer ring */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.3"
        />
        {/* Middle ring */}
        <circle
          cx="12"
          cy="12"
          r="6"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.4"
        />
        {/* Center dot */}
        <circle
          cx="12"
          cy="12"
          r="2"
          fill={color}
        />
      </svg>

      {/* Rotating sweep beam for compact icon */}
      {isActive && (
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            overflow: 'hidden',
            borderRadius: '50%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size / 2,
              height: size / 2,
              transformOrigin: '0% 0%',
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                ${color}50 40%,
                transparent 100%
              )`,
            }}
          />
        </motion.div>
      )}

      {/* Ripple wave 1 */}
      {isActive && (
        <motion.div
          animate={{
            scale: [0.3, 2.2],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0,
          }}
          style={{
            position: 'absolute',
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: '50%',
            border: `1px solid ${color}`,
          }}
        />
      )}

      {/* Ripple wave 2 */}
      {isActive && (
        <motion.div
          animate={{
            scale: [0.3, 2.2],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.5,
          }}
          style={{
            position: 'absolute',
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: '50%',
            border: `1px solid ${color}`,
          }}
        />
      )}
    </div>
  );
});
