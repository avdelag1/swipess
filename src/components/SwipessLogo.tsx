import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient';
}

const sizeMap = {
  xs: 'text-lg',
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
  '2xl': 'text-[10vw] sm:text-7xl',
  '3xl': 'text-[12vw] sm:text-8xl',
  '4xl': 'text-[15vw] sm:text-9xl',
};

function SwipessLogoComponent({
  size = 'md',
  className,
  variant: _variant = 'gradient',
}: SwipessLogoProps) {
  return (
    <div className={cn(
      'relative inline-flex items-center justify-center transition-all duration-300',
      className
    )}>
      <span
        className={cn(
          "font-['Inter'] font-[950] uppercase italic tracking-[-0.04em] leading-none",
          _variant === 'white' ? 'text-white' : _variant === 'black' ? 'text-black' : 'text-foreground',
          sizeMap[size]
        )}
        style={{ paddingRight: '0.15em' }}
      >
        SWIPESS
      </span>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
