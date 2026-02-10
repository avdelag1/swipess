import { memo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FireOrb } from './FireOrb';

interface SwipessLogoWithOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  orbActive?: boolean;
}

/**
 * SWIPESS LOGO WITH FIRE ORB
 * 
 * A fire orb floats above the "i" in Swipess, replacing/overlapping the dot.
 * The orb wanders around curiously then returns to its position above the 'i'.
 * Premium, modern, minimal, slightly magical animation.
 */
function SwipessLogoWithOrbComponent({
  size = 'md',
  className,
  orbActive = true,
}: SwipessLogoWithOrbProps) {
  const [orbSize, setOrbSize] = useState(12);
  const [mounted, setMounted] = useState(false);

  // Responsive sizes - same as SwipessLogo
  const sizeClasses = {
    sm: 'text-3xl sm:text-4xl',
    md: 'text-4xl sm:text-5xl',
    lg: 'text-6xl sm:text-7xl',
    xl: 'text-7xl sm:text-8xl md:text-9xl',
    '2xl': 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]',
    '3xl': 'text-[4.5rem] sm:text-8xl md:text-9xl lg:text-[10rem]',
    '4xl': 'text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[9rem]',
  };

  // Orb sizes for each logo size - tuned for visual balance
  const orbSizes = {
    sm: 8,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 22,
    '3xl': 26,
    '4xl': 28,
  };

  useEffect(() => {
    setOrbSize(orbSizes[size]);
    setMounted(true);
  }, [size]);

  return (
    <span
      className={cn(
        // Use the same swipess-logo class for consistent gradient styling
        'swipess-logo relative select-none inline-block overflow-visible',
        sizeClasses[size],
        className
      )}
    >
      {/* Full logo text - uses swipess-logo gradient */}
      Swipess
      
      {/* Fire Orb - positioned to overlap the 'i' dot
          The 'i' is the 3rd character, approximately at 29.5% of width */}
      {mounted && (
        <span
          className="absolute pointer-events-none"
          style={{
            // Position centered on the 'i' dot
            left: '29.5%',
            // Position at top edge
            top: '5%',
            transform: 'translate(-50%, 0)',
            zIndex: 10,
          }}
        >
          <FireOrb 
            isActive={orbActive} 
            size={orbSize}
          />
        </span>
      )}
    </span>
  );
}

export const SwipessLogoWithOrb = memo(SwipessLogoWithOrbComponent);
