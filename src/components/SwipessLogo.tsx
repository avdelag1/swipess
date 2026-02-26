import { memo } from 'react';
import { cn } from '@/lib/utils';
import { LogoSymbol } from './LogoSymbol';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  showText?: boolean;
}

function SwipessLogoComponent({
  size = 'md',
  className,
  showText = true,
}: SwipessLogoProps) {
  // Responsive sizes - MAXIMUM visibility while fitting screens
  const sizeClasses = {
    xs: 'text-xl sm:text-2xl',
    sm: 'text-3xl sm:text-4xl',
    md: 'text-4xl sm:text-5xl',
    lg: 'text-6xl sm:text-7xl',
    xl: 'text-7xl sm:text-8xl md:text-9xl',
    '2xl': 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]',
    '3xl': 'text-[4.5rem] sm:text-8xl md:text-9xl lg:text-[10rem]',
    '4xl': 'text-[5rem] sm:text-[6rem] md:text-[8rem] lg:text-[11rem]',
  };

  const symbolSizes = {
    xs: 24,
    sm: 36,
    md: 48,
    lg: 72,
    xl: 96,
    '2xl': 120,
    '3xl': 140,
    '4xl': 160,
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoSymbol size={symbolSizes[size]} />
      {showText && (
        <span
          className={cn(
            'swipess-logo font-black italic select-none overflow-visible inline-flex items-end tracking-tighter',
            'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 bg-clip-text text-transparent',
            'drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]',
            sizeClasses[size]
          )}
        >
          Swipess
        </span>
      )}
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
