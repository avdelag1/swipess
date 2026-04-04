import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

/**
 * 🚀 High-Fidelity Swipess Logo — WORDMARK EDITION 🛡️
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  glow = false,
}: SwipessLogoProps) {
  const heightMap = {
    xs: 'h-4 w-16',
    sm: 'h-6 w-24',
    md: 'h-8 w-32',
    lg: 'h-12 w-48',
    xl: 'h-16 w-64',
    '2xl': 'h-20 w-80',
    '3xl': 'h-24 w-96',
    '4xl': 'h-32 w-[32rem]',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Cinematic Glow */}
      {(glow || size === 'xl' || size === '2xl') && (
        <div 
          className="absolute inset-0 rounded-full blur-[35px] opacity-25"
          style={{
            background: 'radial-gradient(circle, var(--color-brand-primary) 0%, transparent 70%)',
            transform: 'scale(1.2, 0.6)',
          }}
        />
      )}
      
      {/* 🚀 ZENITH FLOATING MARK: NEW WORDMARK EDITION */}
      <div
        className={cn(
          'relative transition-all duration-500 transform-gpu overflow-visible',
          heightMap[size]
        )}
      >
        <div 
          className="absolute inset-0 w-full h-full transform-gpu"
          style={{
            WebkitMask: `url(/icons/swipess-wordmark-512.png) center/contain no-repeat`,
            maskImage: `url(/icons/swipess-wordmark-512.png)`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskMode: 'alpha',
            background: 'linear-gradient(110deg, #ff4d00, #ff6b35 45%, #ffffff 50%, #ff6b35 55%, #ff0055)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s infinite linear',
            filter: 'contrast(1.1) brightness(1.1)'
          } as React.CSSProperties}
        />
        
        {glow && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-30 blur-[25px]"
            style={{
              background: 'radial-gradient(circle, rgba(255, 77, 0, 0.8) 0%, transparent 80%)',
              maskImage: `url(/icons/swipess-wordmark-512.png)`,
              WebkitMaskImage: `url(/icons/swipess-wordmark-512.png)`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskMode: 'luminance'
            } as React.CSSProperties}
          />
        )}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
