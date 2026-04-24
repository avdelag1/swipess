import { memo } from 'react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface AtmosphericLayerProps {
  variant?: 'default' | 'primary' | 'indigo' | 'rose';
  opacity?: number;
  speed?: number;
}

/**
 * 🛸 ATMOSPHERIC LAYER
 * Provides consistent visual depth, gradients, and soft glow effects.
 */
export const AtmosphericLayer = memo(({ variant = 'default', opacity = 0.05, speed = 1 }: AtmosphericLayerProps) => {
  const { isLight } = useAppTheme();

  const getGradients = () => {
    switch (variant) {
      case 'primary':
        return {
          top: isLight ? "bg-slate-100/5" : "bg-primary/2",
          bottom: isLight ? "bg-slate-50/2" : "bg-primary/1",
          radial: isLight ? "rgba(255,255,255,0.005)" : "rgba(0,0,0,0.01)"
        };
      case 'rose':
        return {
          top: isLight ? "bg-rose-100/40" : "bg-rose-900/10",
          bottom: isLight ? "bg-rose-50/30" : "bg-rose-500/5",
          radial: isLight ? "rgba(244,63,94,0.02)" : "rgba(244,63,94,0.03)"
        };
      case 'indigo':
        return {
          top: isLight ? "bg-indigo-100/40" : "bg-indigo-900/10",
          bottom: isLight ? "bg-indigo-50/30" : "bg-indigo-500/5",
          radial: isLight ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.03)"
        };
      default:
        return {
          top: isLight ? "bg-slate-200/40" : "bg-indigo-900/10",
          bottom: isLight ? "bg-blue-100/30" : "bg-primary/5",
          radial: isLight ? "rgba(15,23,42,0.01)" : "rgba(255,107,53,0.02)"
        };
    }
  };

  const colors = getGradients();

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      style={{ opacity }}
    >
      <div className={cn(
        "absolute top-[-10%] left-[-10%] w-[80%] h-[60%] blur-[120px] rounded-full transition-colors duration-1000",
        colors.top
      )} />
      <div className={cn(
        "absolute bottom-[-5%] right-[-5%] w-[70%] h-[50%] blur-[100px] rounded-full transition-colors duration-1000",
        colors.bottom
      )} />
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        `bg-[radial-gradient(circle_at_center,${colors.radial}_0%,transparent_70%)]`
      )} />
    </div>
  );
});

AtmosphericLayer.displayName = 'AtmosphericLayer';
