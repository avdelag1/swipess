import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

/**
 * 🚀 SwipesS Logo — Pure CSS Wordmark
 * Matches the landing page LogoWordmark exactly.
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
    '4xl': 'text-6xl tracking-[0.18em]',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Ambient glow for larger sizes */}
      {(glow || size === 'xl' || size === '2xl' || size === '3xl' || size === '4xl') && (
        <div
          className="absolute inset-0 rounded-full blur-[30px] opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            transform: 'scale(1.3, 0.7)',
          }}
        />
      )}

      <span
        className={cn(
          'relative font-black uppercase select-none leading-none text-foreground',
          textSizeMap[size]
        )}
        style={{
          textShadow: '0 0 40px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        SwipesS
      </span>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
