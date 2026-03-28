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
    xl: 'h-20',
    '2xl': 'h-28',
    '3xl': 'h-36',
    '4xl': 'h-48',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center overflow-hidden', className)}>
      <picture>
        <source srcSet="/icons/swipess-flame-s.png" type="image/png" />
        <img
          src="/icons/swipess-flame-s.png"
          alt="Swipess"
          draggable={false}
          className={cn(
            'w-auto object-contain select-none pointer-events-none transition-all duration-300 scale-110',
            'mix-blend-normal', // Using blend modes manually in containers if needed
            heightMap[size]
          )}
        />
      </picture>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
