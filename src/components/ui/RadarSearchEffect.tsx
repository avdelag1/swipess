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
}

/**
 * Radar Search Effect Component
 *
 * Renders a subtle, living radar that's constantly in gentle motion.
 * Feels organic and alive without being dramatic or distracting.
 */
export const RadarSearchEffect = memo(function RadarSearchEffect({
  size = 120,
  color = 'currentColor',
  label,
  className = '',
  isActive = true,
}: RadarSearchEffectProps) {
  const centerSize = size * 0.12;
  const ringGap = size * 0.18;

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div style={containerStyle}>
        {/* Gentle breathing background glow */}
        <motion.div
          animate={isActive ? {
            scale: [1, 1.05, 1],
            opacity: [0.15, 0.25, 0.15],
          } : {}}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          }}
        />

        {/* Subtle concentric guide rings - always slightly moving */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            animate={isActive ? {
              opacity: [0.15, 0.25, 0.15],
              scale: [1, 1.02, 1],
            } : {}}
            transition={{
              duration: 4 + ring * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: ring * 0.3,
            }}
            style={{
              position: 'absolute',
              width: centerSize + ringGap * ring * 2,
              height: centerSize + ringGap * ring * 2,
              borderRadius: '50%',
              border: `1px solid ${color}`,
              opacity: 0.2,
            }}
          />
        ))}

        {/* Gentle rotating sweep - like slow breathing */}
        <motion.div
          animate={isActive ? {
            rotate: [0, 360],
          } : {}}
          transition={{
            duration: 8,
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
                ${color}15 30%,
                ${color}08 60%,
                transparent 100%
              )`,
            }}
          />
        </motion.div>

        {/* Continuous gentle ripple wave 1 */}
        <motion.div
          animate={isActive ? {
            scale: [0.8, 1.8],
            opacity: [0.4, 0],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0,
          }}
          style={{
            position: 'absolute',
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            border: `1.5px solid ${color}`,
            willChange: 'transform, opacity',
          }}
        />

        {/* Continuous gentle ripple wave 2 */}
        <motion.div
          animate={isActive ? {
            scale: [0.8, 1.8],
            opacity: [0.4, 0],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 1,
          }}
          style={{
            position: 'absolute',
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            border: `1.5px solid ${color}`,
            willChange: 'transform, opacity',
          }}
        />

        {/* Continuous gentle ripple wave 3 */}
        <motion.div
          animate={isActive ? {
            scale: [0.8, 1.8],
            opacity: [0.4, 0],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 2,
          }}
          style={{
            position: 'absolute',
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            border: `1.5px solid ${color}`,
            willChange: 'transform, opacity',
          }}
        />

        {/* Breathing center dot - like a heartbeat but subtle */}
        <motion.div
          animate={isActive ? {
            scale: [1, 1.15, 1.05, 1.15, 1],
            opacity: [0.8, 1, 0.9, 1, 0.8],
          } : {}}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.25, 0.4, 0.6, 1],
          }}
          style={{
            position: 'absolute',
            width: centerSize,
            height: centerSize,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />

        {/* Gentle expanding ring from center */}
        <motion.div
          animate={isActive ? {
            scale: [1, 2.5],
            opacity: [0.3, 0],
          } : {}}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: centerSize * 1.2,
            height: centerSize * 1.2,
            borderRadius: '50%',
            border: `1px solid ${color}`,
          }}
        />

        {/* Second expanding ring - offset for continuous motion */}
        <motion.div
          animate={isActive ? {
            scale: [1, 2.5],
            opacity: [0.3, 0],
          } : {}}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 1.75,
          }}
          style={{
            position: 'absolute',
            width: centerSize * 1.2,
            height: centerSize * 1.2,
            borderRadius: '50%',
            border: `1px solid ${color}`,
          }}
        />

        {/* Subtle outer breathing ring */}
        <motion.div
          animate={isActive ? {
            scale: [1, 1.08, 1],
            opacity: [0.25, 0.15, 0.25],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: size * 0.92,
            height: size * 0.92,
            borderRadius: '50%',
            border: `1.5px solid ${color}`,
          }}
        />
      </div>

      {/* Optional label */}
      {label && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-muted-foreground"
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
