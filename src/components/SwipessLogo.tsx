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
  const heightMap = {
    xs: 'h-10',
    sm: 'h-14',
    md: 'h-20',
    lg: 'h-32',
    xl: 'h-48',
    '2xl': 'h-64',
    '3xl': 'h-80',
    '4xl': 'h-96',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <img
        src="/icons/swipess-logo.webp"
        alt="Swipess"
        width="960"
        height="640"
        draggable={false}
        fetchPriority="high"
        decoding="async"
        className={cn(
          'w-auto object-contain select-none pointer-events-none transition-all duration-300',
          heightMap[size]
        )}
      />
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
