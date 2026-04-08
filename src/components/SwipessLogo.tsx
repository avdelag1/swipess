import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient';
}

const sizeMap = {
  xs: 'h-4',
  sm: 'h-5',
  md: 'h-8',
  lg: 'h-12',
  xl: 'h-16',
  '2xl': 'h-20',
  '3xl': 'h-24',
  '4xl': 'h-32',
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
        src="/icons/swipess-brand-logo.jpg"
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
