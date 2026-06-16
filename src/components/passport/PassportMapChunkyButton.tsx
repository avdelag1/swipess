import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PassportMapChunkyButtonProps {
  icon: LucideIcon;
  label: string;
  gradient: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
  className?: string;
}

export const PassportMapChunkyButton = memo(({
  icon: Icon,
  label,
  gradient,
  active = false,
  onClick,
  badge,
  className,
}: PassportMapChunkyButtonProps) => (
  <div className="relative flex flex-col items-center gap-1">
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'relative w-[44px] h-[44px] flex items-center justify-center shrink-0 rounded-full border shadow-lg transition-all duration-200',
          active
            ? 'border-white/40 text-white'
            : 'border-white/10 text-white/80 hover:bg-white/10',
          className,
        )}
        aria-label={badge != null && badge > 0 ? `${label}, ${badge} nearby` : label}
        title={label}
      >
        <div className="absolute inset-0 rounded-full bg-[#1A202C]/60 backdrop-blur-[10px]" />
        {active && (
          <div
            className="absolute inset-0 rounded-full opacity-80"
            style={{ background: gradient }}
          />
        )}
        <Icon className="w-5 h-5 shrink-0 relative z-10" strokeWidth={active ? 2.5 : 2.0} />
      </button>
      {badge != null && badge > 0 && (
        <span
          className="absolute -top-1.5 -right-2.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#00E5FF] text-[10px] font-black text-[#0B0E14] flex items-center justify-center shadow-[0_2px_8px_rgba(0,229,255,0.45)] z-30 ring-2 ring-[#0a0a12]"
          aria-hidden
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
    <span className="text-[9px] font-bold uppercase tracking-wider text-white/55 max-w-[52px] text-center leading-tight">
      {label}
    </span>
  </div>
));
PassportMapChunkyButton.displayName = 'PassportMapChunkyButton';