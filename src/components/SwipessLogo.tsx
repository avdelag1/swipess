import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient';
}

/**
 * 🚀 SwipesS Logo — Speed of Light Ultra-Minimalist Design
 * Upgraded with breathable margins to prevent italic clipping in various frames.
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  variant = 'gradient',
}: SwipessLogoProps) {
  const textSizeMap = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
    '2xl': 'text-6xl',
    '3xl': 'text-7xl',
    '4xl': 'text-8xl',
  };

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center transition-all duration-300',
      'text-white',
      className
    )}>
      <span
        className={cn(
          'relative font-[950] uppercase select-none leading-none italic', 
          variant === 'gradient' ? "bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 bg-clip-text text-transparent" : "text-white",
          textSizeMap[size]
        )}
        style={{
          textRendering: 'optimizeLegibility',
          fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
          letterSpacing: '-0.02em', // Slightly relaxed for better visual breathing
          display: 'inline-block',
          width: 'auto',
          maxWidth: '100%',
          paddingRight: '0.15em', // CRITICAL: Prevents italic 'S' from clipping in tight containers
          paddingLeft: '0.05em',  // Balanced alignment
        }}
      >
        SwipesS
      </span>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
