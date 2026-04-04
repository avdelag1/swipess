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
  const textSizeMap = {
    xs: 'text-xs tracking-[0.2em]',
    sm: 'text-sm tracking-[0.2em]',
    md: 'text-lg tracking-[0.25em]',
    lg: 'text-2xl tracking-[0.25em]',
    xl: 'text-3xl tracking-[0.25em]',
    '2xl': 'text-4xl tracking-[0.25em]',
    '3xl': 'text-5xl tracking-[0.25em]',
    '4xl': 'text-6xl tracking-[0.3em]',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {(glow || size === 'xl' || size === '2xl') && (
        <div 
          className="absolute inset-0 rounded-full blur-[40px] opacity-30 animate-pulse-soft"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            transform: 'scale(1.5)',
          }}
        />
      )}
      
      <span
        className={cn(
          'relative font-black uppercase select-none text-foreground',
          textSizeMap[size]
        )}
      >
        SwipesS
      </span>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
