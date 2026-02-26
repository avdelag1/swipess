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
import { motion } from 'framer-motion';
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
        {/* Premium Sentient Glow Layer */}
        <motion.div
          animate={isActive ? {
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            background: [
              `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
              `radial-gradient(circle, #f9731650 0%, transparent 70%)`,
              `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
            ]
          } : {
            opacity: 0.1,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: -1,
          }}
        />

        {/* Thick Discovery Waves - Flowing with rotation */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            animate={isActive ? {
              scale: [0.8, 2.8],
              opacity: [0.8, 0],
              rotate: [0, 90],
            } : {
              scale: 1,
              opacity: 0.1,
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.23, 1, 0.32, 1],
              delay: ring * 0.8,
            }}
            style={{
              position: 'absolute',
              width: centerSize,
              height: centerSize,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              boxShadow: `0 0 15px ${color}20`,
              willChange: 'transform, opacity',
            }}
          />
        ))}

        {/* The Central Hub - "Sentient" Breathing */}
        <motion.div
          animate={isActive ? {
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0],
            boxShadow: [
              `0 0 20px ${color}30`,
              `0 0 50px ${color}50`,
              `0 0 20px ${color}30`,
            ],
          } : {
            scale: 1,
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: centerSize,
            height: centerSize,
            borderRadius: '2.5rem', // More rounded for premium feel
            backgroundColor: 'rgba(0,0,0,0.85)',
            border: `3px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            backdropFilter: 'blur(20px)',
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          {/* Internal Glow for depth */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at center, ${color} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 scale-[1.5]">
            {icon || <User size={36} strokeWidth={3} />}
          </div>
        </motion.div>

        {/* Subtle breathing outer guide */}
        <div
          style={{
            position: 'absolute',
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: '50%',
            border: `1px solid ${color}15`,
            opacity: 0.5,
          }}
        />
      </div>

      {/* Optional label */}
      {label && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40"
        >
          {label}
        </motion.span>
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
