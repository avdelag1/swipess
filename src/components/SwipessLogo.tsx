import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient' | 'icon';
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
  variant = 'gradient',
}: SwipessLogoProps) {
  const isIcon = variant === 'icon';
  // White variant: invert the orange wordmark to pure white
  const isWhite = variant === 'white';

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center transition-all duration-300',
      className
    )}>
      <img
        src={isIcon ? "/icons/Swipess-logo-transparent.png" : "/icons/Swipess-wordmark-transparent-v2.png"}
        alt="Swipess"
        draggable={false}
        fetchPriority="high"
        decoding={isIcon ? "async" : "sync"}
        className={cn(
          'select-none transition-all duration-300',
          isIcon ? 'w-full h-full object-contain' : cn('w-auto max-w-full', sizeMap[size])
        )}
        style={{
          imageRendering: 'auto',
        }}
      />
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);


