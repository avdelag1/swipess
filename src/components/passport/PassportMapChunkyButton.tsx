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
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'map-hud-btn relative w-[58px] flex flex-col items-center justify-center gap-1 rounded-2xl border shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
      active
        ? 'text-white border-white/30 py-2.5'
        : 'map-hud-panel border-white/15 text-white/75 py-2 hover:bg-black/55',
      className,
    )}
    style={active ? { background: gradient } : undefined}
  >
    <Icon className="w-5 h-5 shrink-0" strokeWidth={2.2} />
    <span className="text-[7px] font-black uppercase italic tracking-wider leading-none text-center px-0.5">
      {label}
    </span>
    {badge != null && badge > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[8px] font-black text-slate-900 flex items-center justify-center shadow-md">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
));
PassportMapChunkyButton.displayName = 'PassportMapChunkyButton';