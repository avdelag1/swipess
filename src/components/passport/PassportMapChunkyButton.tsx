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
      'relative w-[44px] h-[44px] flex items-center justify-center shrink-0 rounded-full border shadow-lg overflow-hidden transition-all duration-200',
      active
        ? 'border-white/40 text-white'
        : 'border-white/10 text-white/80 hover:bg-white/10',
      className,
    )}
    title={label}
  >
    {/* Glass background */}
    <div className="absolute inset-0 bg-[#1A202C]/60 backdrop-blur-[10px]" />
    {active && (
      <div
        className="absolute inset-0 opacity-80"
        style={{ background: gradient }}
      />
    )}
    
    <Icon className="w-5 h-5 shrink-0 relative z-10" strokeWidth={active ? 2.5 : 2.0} />
    
    {badge != null && badge > 0 && (
      <span className="absolute top-0 right-0 min-w-[16px] h-[16px] px-1 rounded-full bg-[#00E5FF] text-[9px] font-black text-[#0B0E14] flex items-center justify-center shadow-md z-20 transform translate-x-1/4 -translate-y-1/4">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
));
PassportMapChunkyButton.displayName = 'PassportMapChunkyButton';