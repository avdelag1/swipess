import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

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
      
      <img
        src="/icons/fire-s-logo-512.png"
        alt="Swipess"
        className={cn(
          'relative object-contain transition-all duration-500',
          heightMap[size]
        )}
        draggable={false}
      />

      {/* Detached glow layer */}
      {glow && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 blur-[30px]"
          style={{
            background: 'radial-gradient(circle, rgba(255, 77, 0, 0.8) 0%, transparent 80%)',
          }}
        />
      )}
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
