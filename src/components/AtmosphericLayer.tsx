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
export const AtmosphericLayer = memo(({ variant = 'default', opacity = 0.08, speed = 1 }: AtmosphericLayerProps) => {
  const { isLight } = useAppTheme();

  const getGradients = () => {
    switch (variant) {
      case 'primary':
        return {
          top: isLight ? "bg-blue-400/10" : "bg-primary/5",
          bottom: isLight ? "bg-indigo-300/10" : "bg-primary/2",
          radial: isLight ? "rgba(59,130,246,0.02)" : "rgba(255,107,53,0.03)"
        };
      case 'rose':
        return {
          top: isLight ? "bg-rose-200/20" : "bg-rose-900/15",
          bottom: isLight ? "bg-rose-100/15" : "bg-rose-500/8",
          radial: isLight ? "rgba(244,63,94,0.03)" : "rgba(244,63,94,0.04)"
        };
      case 'indigo':
        return {
          top: isLight ? "bg-indigo-200/20" : "bg-indigo-900/15",
          bottom: isLight ? "bg-indigo-100/15" : "bg-indigo-500/8",
          radial: isLight ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.04)"
        };
      case 'midnight' as any:
        return {
          top: "bg-slate-900/20",
          bottom: "bg-blue-900/15",
          radial: "rgba(30,41,59,0.05)"
        };
      case 'sunset' as any:
        return {
          top: "bg-orange-500/10",
          bottom: "bg-purple-600/10",
          radial: "rgba(249,115,22,0.03)"
        };
      default:
        return {
          top: isLight ? "bg-slate-200/30" : "bg-indigo-900/12",
          bottom: isLight ? "bg-blue-100/25" : "bg-primary/6",
          radial: isLight ? "rgba(15,23,42,0.02)" : "rgba(255,107,53,0.03)"
        };
    }
  };

  const colors = getGradients();

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      style={{ opacity }}
    >
      {/* 🔮 LIQUID DEPTH: Reacts to DashboardLayout's mouse tracking */}
      <div 
        className="absolute inset-[-10%] transition-transform duration-1000 ease-out"
        style={{
          transform: 'translate(calc(var(--mouse-x, 50%) * 0.02 - 1%), calc(var(--mouse-y, 50%) * 0.02 - 1%))'
        }}
      >
        <div className={cn(
          "absolute top-[-15%] left-[-15%] w-[90%] h-[70%] blur-[160px] rounded-full transition-colors duration-1000",
          colors.top
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] blur-[140px] rounded-full transition-colors duration-1000",
          colors.bottom
        )} />
      </div>

      {/* 🧘 SENTIENT NODES: Slow drifting particles for liveness */}
      <div className="absolute inset-0 opacity-40">
        <div className={cn(
          "absolute top-[20%] left-[30%] w-64 h-64 blur-[100px] rounded-full animate-float-slow",
          isLight ? "bg-primary/5" : "bg-primary/10"
        )} style={{ animationDelay: '0s' }} />
        <div className={cn(
          "absolute bottom-[30%] right-[20%] w-80 h-80 blur-[120px] rounded-full animate-float-slow",
          isLight ? "bg-blue-400/5" : "bg-blue-400/10"
        )} style={{ animationDelay: '-4s', animationDirection: 'reverse' }} />
      </div>

      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        `bg-[radial-gradient(circle_at_center,${colors.radial}_0%,transparent_80%)]`
      )} />
    </div>
  );
});

AtmosphericLayer.displayName = 'AtmosphericLayer';
