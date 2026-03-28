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
    xs: 'h-6',
    sm: 'h-9',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-24',
    '2xl': 'h-32',
    '3xl': 'h-48',
    '4xl': 'h-64',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <img
        src="/icons/fire-s-logo-960.webp"
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
