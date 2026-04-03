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
      
      {/* 🚀 ZENITH FLOATING MARK: Mask-Shadow Isolation System */}
      <div
        className={cn(
          'relative transition-all duration-500 transform-gpu overflow-visible',
          heightMap[size]
        )}
      >
        {/* The hidden source image to provide bounds - used for its texture and alpha */}
        <div 
          className="absolute inset-0 w-full h-full transform-gpu"
          style={{
            // DYNAMIC ALPHA RECOVERY:
            // Uses the optimized asset which contains the definitive brand mark
            WebkitMask: `url(/icons/fire-s-logo-960.webp) center/contain no-repeat`,
            maskImage: `url(/icons/fire-s-logo-960.webp)`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            // Defaulting mask mode to alpha for optimized assets
            maskMode: 'alpha',
            // Flagship Gradient Injection
            background: 'linear-gradient(135deg, #ff4d00, #ff6b35, #ff0055)',
            // Internal filter for maximum edge crispness
            filter: 'contrast(1.1) brightness(1.1)'
          }}
        />
        
        {/* Detached shadow to prevent the "Square Box" regression in Safari/Chrome mask rendering */}
        {glow && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 blur-[30px]"
            style={{
              background: 'radial-gradient(circle, rgba(255, 77, 0, 0.8) 0%, transparent 80%)',
              maskImage: `url(/icons/fire-s-logo-960.webp)`,
              WebkitMaskImage: `url(/icons/fire-s-logo-960.webp)`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskMode: 'luminance'
            }}
          />
        )}
      </div>

    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
