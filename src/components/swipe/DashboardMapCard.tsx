import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface DashboardMapCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps the map + chip row in a single rounded card that fills the exact
 * vertical slot between the fixed TopBar and the fixed BottomNav. The height
 * formula uses dvh + env(safe-area-inset-*) so it stays stable on iOS Safari
 * (address-bar collapse), Capacitor iOS/Android, and desktop browsers.
 *
 * Parent context: <DashboardLayout> already pads by
 * calc(var(--top-bar-height) + var(--safe-top)). This component only has to
 * subtract bottom-nav + bottom-safe and leave small gutters.
 */
export function DashboardMapCard({ children, className }: DashboardMapCardProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light' || theme === 'ivanna-style';

  return (
    <div
      className="w-full flex-1 relative flex items-stretch justify-center px-0 py-0 min-h-0"
    >
      <div
        className={cn(
          'w-full h-full overflow-hidden flex flex-col relative',
          'shadow-none', // Removed heavy shadow for full-bleed feel
          isLight
            ? 'bg-white'
            : 'bg-[#0f0f12]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default DashboardMapCard;
