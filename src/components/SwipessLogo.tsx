import { memo } from 'react';
import { cn } from '@/lib/utils';
import swipessLogo from '@/assets/swipess-logo-flame.png';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

function SwipessLogoComponent({
  size = 'md',
  className,
}: SwipessLogoProps) {
  // Map our size keys to pixel heights that maintain the premium look
  const heightMap = {
    xs: 'h-6',      // ~24px
    sm: 'h-8',      // ~32px
    md: 'h-10',     // ~40px
    lg: 'h-14',     // ~56px
    xl: 'h-20',     // ~80px
    '2xl': 'h-28',  // ~112px
    '3xl': 'h-36',  // ~144px
    '4xl': 'h-48',  // ~192px
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center overflow-visible', className)}>
      <img
        src={swipessLogo}
        alt="Swipess"
        className={cn(
          'w-auto object-contain select-none pointer-events-none transition-all duration-300',
          heightMap[size]
        )}
      />
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
