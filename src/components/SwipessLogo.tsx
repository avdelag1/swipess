import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient' | 'icon' | 'transparent';
}

const sizeMap = {
  xs: 'h-5',
  sm: 'h-7',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-20',
  '2xl': 'h-28',
  '3xl': 'h-36',
  '4xl': 'h-44',
  '5xl': 'h-24 sm:h-32',
  '6xl': 'h-32 sm:h-48',
  '7xl': 'h-40 sm:h-64',
  '8xl': 'h-48 sm:h-80',
};

function SwipessLogoComponent({
  size = 'md',
  className,
  variant = 'transparent',
}: SwipessLogoProps) {
  // SINGLE LOGO DESIGN: every variant renders the same wordmark/icon image.
  // The previous "white"/"black" variants rendered plain text "SWIPESS" which
  // looked completely different from the real logo and caused visual mismatch
  // between the splash, landing page, and inline badges.
  const isIcon = variant === 'icon';
  const src = isIcon ? '/icons/Swipess-logo.png' : '/icons/Swipess-wordmark-white.png';
  const fallbackSrc = isIcon ? '/icons/Swipess-logo.svg' : '/icons/Swipess-wordmark-white.svg';

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center transition-all duration-300 group',
      className
    )}>
      {variant === 'gradient' && (
        <div className="absolute inset-0 -z-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl bg-primary/20 rounded-full scale-150" />
      )}

      <div className={cn('flex items-center select-none relative z-10', isIcon ? 'justify-center' : '')}>
        <div className="relative">
          <img
            src={src}
            alt="Swipess"
            draggable={false}
            {...({ fetchpriority: 'high' } as any)}
            decoding={isIcon ? 'async' : 'sync'}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.endsWith('.png')) {
                target.src = fallbackSrc;
              }
            }}
            className={cn(
              'select-none transition-all duration-300 relative z-10',
              isIcon ? 'w-full h-full object-contain' : cn('w-full h-full object-contain max-w-full', sizeMap[size]),
              variant === 'black' ? 'invert' : '',
              'drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)]'
            )}
            style={{
              imageRendering: 'auto',
              filter: variant === 'gradient' ? 'drop-shadow(0 0 15px rgba(255,255,255,0.25)) brightness(1.1)' : undefined,
            }}
          />
          {variant === 'gradient' && !isIcon && (
            <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full opacity-50 pointer-events-none -z-1" />
          )}
        </div>
      </div>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
