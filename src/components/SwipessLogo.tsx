import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

/**
 * 🚀 SwipesS Logo — Premium CSS Wordmark with depth
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  glow = false,
}: SwipessLogoProps) {
  const textSizeMap = {
    xs: 'text-xs tracking-[0.12em]',
    sm: 'text-sm tracking-[0.12em]',
    md: 'text-xl tracking-[0.14em]',
    lg: 'text-3xl tracking-[0.14em]',
    xl: 'text-4xl tracking-[0.14em]',
    '2xl': 'text-5xl tracking-[0.14em]',
    '3xl': 'text-6xl tracking-[0.14em]',
    '4xl': 'text-7xl tracking-[0.14em]',
  };

  const showGlow = glow || size === 'xl' || size === '2xl' || size === '3xl' || size === '4xl';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full blur-[35px] opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            transform: 'scale(1.4, 0.6)',
          }}
        />
      )}

      <span
        className={cn(
          'relative font-black uppercase select-none leading-none text-foreground',
          textSizeMap[size]
        )}
        style={{
          textShadow: '0 1px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.08)',
          WebkitTextStroke: '0.3px rgba(255,255,255,0.08)',
        } as React.CSSProperties}
      >
        SwipesS
      </span>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
