import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient';
}

const sizeMap = {
  xs: 'h-6',
  sm: 'h-9',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-24',
  '2xl': 'h-36',
  '3xl': 'h-48',
  '4xl': 'h-60',
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
      <img
        src="/icons/swipess-brand-logo.webp"
        alt="SwipesS"
        draggable={false}
        className={cn(
          'object-contain select-none',
          sizeMap[size]
        )}
        style={{
          imageRendering: 'auto',
          width: 'auto',
        }}
      />
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
