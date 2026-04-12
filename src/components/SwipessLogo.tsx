import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient';
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
        src="/icons/swipess-wordmark-512.png"
        alt="Swipess"
        draggable={false}
        className={cn(
          'select-none w-auto',
          sizeMap[size]
        )}
        style={{
          imageRendering: 'auto',
          maxWidth: '80vw',
        }}
      />
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
