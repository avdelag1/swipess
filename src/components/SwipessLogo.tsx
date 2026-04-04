import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

/**
 * 🚀 High-Fidelity Swipess Logo — FLOATING EDITION 🛡️
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  glow = false,
}: SwipessLogoProps) {
  const textSizeMap = {
    xs: 'text-xs tracking-[0.15em]',
    sm: 'text-sm tracking-[0.15em]',
    md: 'text-lg tracking-[0.18em]',
    lg: 'text-2xl tracking-[0.18em]',
    xl: 'text-3xl tracking-[0.18em]',
    '2xl': 'text-4xl tracking-[0.18em]',
    '3xl': 'text-5xl tracking-[0.18em]',
    '4xl': 'text-6xl tracking-[0.2em]',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {(glow || size === 'xl' || size === '2xl') && (
        <div 
<<<<<<< HEAD
          className="absolute inset-0 rounded-full blur-[40px] opacity-20 animate-pulse-soft"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            transform: 'scale(1.5)',
=======
          className="absolute inset-0 rounded-full blur-[35px] opacity-30"
          style={{
            background: 'radial-gradient(circle, var(--color-brand-primary) 0%, transparent 70%)',
            transform: 'scale(1.4)',
>>>>>>> df25a7bb ( Performance Perfection & Heartbeat Branding: Optimized initial load, deferred heavy JS, and refined the flagship logo heartbeat animation.)
          }}
        />
      )}
      
<<<<<<< HEAD
      <span
        className={cn(
          'relative font-black uppercase select-none text-foreground leading-none',
          textSizeMap[size]
        )}
        style={{
          textShadow: '0 0 30px rgba(255,255,255,0.1), 0 1px 4px rgba(0,0,0,0.3)',
        }}
      >
        SwipesS
      </span>
=======
      {/* 🚀 ZENITH FLOATING MARK: Mask-Shadow Isolation System */}
      <div
        className={cn(
          'relative transition-all duration-500 transform-gpu overflow-visible',
          heightMap[size]
        )}
      >
        <div 
          className="absolute inset-0 w-full h-full transform-gpu"
          style={{
            WebkitMask: `url(/icons/fire-s-logo-960.webp) center/contain no-repeat`,
            maskImage: `url(/icons/fire-s-logo-960.webp)`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskMode: 'alpha',
            background: 'linear-gradient(135deg, #ff4d00, #ff6b35, #ff0055)',
            filter: 'contrast(1.1) brightness(1.1)'
          } as React.CSSProperties}
        />
        
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
            } as React.CSSProperties}
          />
        )}
      </div>
>>>>>>> df25a7bb ( Performance Perfection & Heartbeat Branding: Optimized initial load, deferred heavy JS, and refined the flagship logo heartbeat animation.)
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
