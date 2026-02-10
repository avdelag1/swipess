import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

function SwipessLogoComponent({
  size = 'md',
  className,
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

  return (
    <span
      className={cn(
        'swipess-logo font-bold italic select-none overflow-visible inline-flex items-end',
        'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 bg-clip-text text-transparent',
        'drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]',
        sizeClasses[size],
        className
      )}
    >
      Swipess
    </span>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
