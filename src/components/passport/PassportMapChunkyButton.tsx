import { memo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MotionIcon } from '@/components/ui/MotionIcon';

interface PassportMapChunkyButtonProps {
  icon: LucideIcon;
  label: string;
  gradient: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}

export const PassportMapChunkyButton = memo(({
  icon: Icon,
  label,
  gradient,
  active = false,
  onClick,
  badge,
  className,
  compact = true,
  showLabel = true,
}: PassportMapChunkyButtonProps) => {
  const [pressed, setPressed] = useState(false);
  const size = compact ? 'w-[34px] h-[34px]' : 'w-[44px] h-[44px]';
  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="relative flex flex-col items-center gap-0.5">
      <div className="relative">
        <button
          type="button"
          data-no-cinematic
          onClick={onClick}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          className={cn(
            'map-hud-btn press-snappy relative flex items-center justify-center shrink-0 rounded-full shadow-lg transition-all duration-300',
            size,
            active
              ? 'text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] scale-105'
              : 'bg-[#161b27]/95 border border-white/10 text-white/90 hover:bg-[#202738]/95 hover:scale-105',
            className,
          )}
          style={active ? { background: gradient } : undefined}
          aria-label={badge != null && badge > 0 ? `${label}, ${badge} nearby` : label}
          title={label}
        >
          <MotionIcon id="map" active={pressed} loop={active}>
            <Icon className={cn(iconSize, 'shrink-0 relative z-10')} strokeWidth={active ? 2.5 : 2.0} />
          </MotionIcon>
        </button>
        {badge != null && badge > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 rounded-full bg-[#00E5FF] font-black text-[#0B0E14] flex items-center justify-center shadow-[0_2px_6px_rgba(0,229,255,0.4)] z-30 ring-2 ring-[#0a0a12]',
              compact ? 'min-w-[16px] h-[16px] px-0.5 text-[8px]' : 'min-w-[20px] h-[20px] px-1 text-[10px]',
            )}
            aria-hidden
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {showLabel && (
        <span className={cn(
          'font-bold uppercase tracking-wider text-white/50 text-center leading-tight',
          compact ? 'text-[8px] max-w-[40px]' : 'text-[9px] max-w-[52px]',
        )}
        >
          {label}
        </span>
      )}
    </div>
  );
});
PassportMapChunkyButton.displayName = 'PassportMapChunkyButton';