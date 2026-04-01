import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  glow?: boolean;
}

/**
 * 🚀 High-Fidelity Swipess Logo
 * 
 * Features:
 * - Animated 135deg gradient shift (per premium spec)
 * - Multi-layer cinematic glow
 * - GPU-accelerated transforms
 * - Zero-layout-cost scaling
 */
function SwipessLogoComponent({
  size = 'md',
  className,
  glow = false,
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
      {/* Cinematic Glow - Renders behind the logo */}
      {(glow || size === 'xl' || size === '2xl') && (
        <div 
          className="absolute inset-0 rounded-full blur-[40px] opacity-40 animate-pulse-soft"
          style={{
            background: 'radial-gradient(circle, var(--color-brand-primary) 0%, transparent 70%)',
            transform: 'scale(1.5)',
          }}
        />
      )}
      
      <img
        src="/icons/fire-s-logo-960.webp"
        alt="Swipess Fire-S"
        draggable={false}
        fetchPriority="high"
        decoding="async"
        className={cn(
          'w-auto object-contain select-none pointer-events-none transition-all duration-300',
          'transform-gpu',
          // Premium Glow & Shadow System — simplified on hw-low to save paint cycles
          'drop-shadow-[0_0_20px_rgba(255,77,0,0.4)]',
          glow && 'drop-shadow-[0_0_40px_rgba(255,77,0,0.6)]',
          heightMap[size]
        )}
        style={{
          filter: (glow && !document.body.classList.contains('hw-low')) ? `
            drop-shadow(0 0 20px rgba(255, 77, 0, 0.6))
            drop-shadow(0 0 40px rgba(255, 107, 53, 0.3))
            drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))
          ` : undefined
        }}
      />
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
