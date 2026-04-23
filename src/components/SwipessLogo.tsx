import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl';
  className?: string;
  variant?: 'white' | 'black' | 'outline' | 'gradient' | 'icon' | 'transparent';
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
  '5xl': 'h-24 sm:h-32',
  '6xl': 'h-32 sm:h-48',
  '7xl': 'h-40 sm:h-64',
  '8xl': 'h-48 sm:h-80',
};

function SwipessLogoComponent({
  size = 'md',
  className,
  variant = 'transparent',
}: SwipessLogoProps) {
  const isIcon = variant === 'icon';

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center transition-all duration-300 group',
      className
    )}>
        {/* Premium Aura Glow */}
        {variant === 'gradient' && (
          <div className="absolute inset-0 -z-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl bg-primary/20 rounded-full scale-150" />
        )}
        
        <div className={cn("flex items-center select-none relative z-10", isIcon ? "justify-center" : "")}>
          {variant === 'white' || variant === 'black' ? (
            <span className={cn(
              "font-black tracking-[-0.05em] italic uppercase drop-shadow-lg", 
              variant === 'white' ? 'text-white' : 'text-black',
              isIcon ? "text-xl" : size === 'xs' ? 'text-sm' : size === 'sm' ? 'text-base' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'
            )}>
              Swipess
            </span>
          ) : (
            <div className="relative">
              <img
                src={isIcon ? "/icons/Swipess-logo-transparent.png" : "/icons/Swipess-wordmark-white.png"}
                alt="Swipess"
                draggable={false}
                fetchPriority="high"
                decoding={isIcon ? "async" : "sync"}
                className={cn(
                  'select-none transition-all duration-300 relative z-10',
                  isIcon ? 'w-full h-full object-contain' : cn('w-auto object-contain max-w-full', sizeMap[size]),
                  variant === 'transparent' ? '' : 'drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)]'
                )}
                style={{
                  imageRendering: 'auto',
                }}
              />
              {variant === 'gradient' && !isIcon && (
                <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full opacity-50 pointer-events-none -z-1" />
              )}
            </div>
          )}
        </div>
    </div>
  );
}

export const SwipessLogo = memo(SwipessLogoComponent);
