import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

/**
 * 🚀 SwipesS Logo — Premium CSS Wordmark with depth & glow
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  glow = false,
}: SwipessLogoProps) {
  const textSizeMap = {
    xs: 'text-sm tracking-[0.12em]',
    sm: 'text-base tracking-[0.12em]',
    md: 'text-2xl tracking-[0.14em]',
    lg: 'text-4xl tracking-[0.14em]',
    xl: 'text-5xl tracking-[0.14em]',
    '2xl': 'text-6xl tracking-[0.14em]',
    '3xl': 'text-7xl tracking-[0.14em]',
    '4xl': 'text-8xl tracking-[0.14em]',
  };

  const showGlow = glow || size === 'xl' || size === '2xl' || size === '3xl' || size === '4xl';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)',
            transform: 'scale(1.6, 0.8)',
            filter: 'blur(40px)',
          }}
        />
      )}

      <span
        className={cn(
          'relative font-[900] uppercase select-none leading-none text-foreground',
          textSizeMap[size]
        )}
        style={{
          textShadow: '0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(0,0,0,0.6), 0 0 80px rgba(255,255,255,0.12), 0 0 120px rgba(255,255,255,0.06)',
          WebkitTextStroke: '0.4px rgba(255,255,255,0.1)',
        } as React.CSSProperties}
      >
        SwipesS
      </span>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
