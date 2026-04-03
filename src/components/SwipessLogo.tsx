import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

/**
 * 🚀 High-Fidelity Swipess Logo — FLOATING EDITION 🛡️
 * 
 * Re-navigated to meet the user's 'letter floating' specification.
 * Uses CSS Luminance Masking to dynamically remove the black background box from the source 
 * raster image in real-time. This guarantees the logo floats purely on any background color.
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  glow = false,
}: SwipessLogoProps) {
  const heightMap = {
    xs: 'h-10 w-10',
    sm: 'h-14 w-14',
    md: 'h-20 w-20',
    lg: 'h-32 w-32',
    xl: 'h-48 w-48',
    '2xl': 'h-64 w-64',
    '3xl': 'h-80 w-80',
    '4xl': 'h-96 w-96',
  };

  const logoUrl = '/icons/fire-s-logo-960.webp';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Cinematic Glow */}
      {(glow || size === 'xl' || size === '2xl') && (
        <div 
          className="absolute inset-0 rounded-full blur-[40px] opacity-40 animate-pulse-soft"
          style={{
            background: 'radial-gradient(circle, var(--color-brand-primary) 0%, transparent 70%)',
            transform: 'scale(1.5)',
          }}
        />
      )}
      
      {/* 🧬 LUMINANCE MASK: Isolates the mark from its black background */}
      <div
        className={cn(
          'transition-all duration-500 transform-gpu',
          heightMap[size]
        )}
        style={{
          // Use the high-res source as a luminance mask
          WebkitMask: `url(/icons/fire-s-logo-960.webp) luminance center/contain no-repeat`,
          mask: `url(/icons/fire-s-logo-960.webp) luminance center/contain no-repeat`,
          // Fill the isolated mark with our flagship gradient
          background: 'linear-gradient(135deg, #ff4d00, #ff6b35, #ff0055)',
          filter: glow ? `
            drop-shadow(0 0 30px rgba(255, 77, 0, 0.4))
          ` : 'none'
        }}
      />

    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
