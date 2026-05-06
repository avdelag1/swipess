/**
 * RadarSearchIcon - small inline pulse icon used by MarketingSlide.
 * The legacy full-size RadarSearchEffect has been removed (unused).
 */
import { memo } from 'react';
import { motion } from 'framer-motion';

interface RadarSearchIconProps {
  size?: number;
  color?: string;
  isActive?: boolean;
  className?: string;
}

export const RadarSearchIcon = memo(function RadarSearchIcon({
  size = 24,
  color = 'currentColor',
  isActive = true,
  className = '',
}: RadarSearchIconProps) {
  return (
    <div
      style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      className={className}
    >
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
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size / 2,
              height: size / 2,
              transformOrigin: '0% 0%',
              background: `conic-gradient(from 0deg, transparent 0%, ${color}50 40%, transparent 100%)`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
});
