import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient';
}

/**
 * 🚀 SwipesS Logo — Speed of Light Ultra-Minimalist Design
 * Clean, razor-sharp typography with a premium brand background.
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  variant = 'gradient',
}: SwipessLogoProps) {
  const textSizeMap = {
    xs: 'text-sm tracking-[0.16em]',
    sm: 'text-base tracking-[0.16em]',
    md: 'text-2xl tracking-[0.18em]',
    lg: 'text-4xl tracking-[0.22em]',
    xl: 'text-5xl tracking-[0.24em]',
    '2xl': 'text-6xl tracking-[0.26em]',
    '3xl': 'text-7xl tracking-[0.28em]',
    '4xl': 'text-8xl tracking-[0.3em]',
  };

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center transition-all duration-300',
      'text-white', // Force white for Speed of Light brand identity
      className
    )}>
      <span
        className={cn(
          'relative font-[950] uppercase select-none leading-none italic tracking-tighter', 
          variant === 'gradient' ? "bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 bg-clip-text text-transparent" : "text-white",
          textSizeMap[size]
        )}
        style={{
          // Zero shade, pure sharpness
          textRendering: 'optimizeLegibility',
          fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
          letterSpacing: '-0.02em',
        }}
      >
        SwipesS
      </span>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
