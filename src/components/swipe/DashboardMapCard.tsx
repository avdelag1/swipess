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

  return (
    <div
      className="w-full flex-1 relative flex items-stretch justify-center px-0 py-0 min-h-0 bg-transparent"
    >
      <div
        className={cn(
          'w-full h-full overflow-hidden flex flex-col relative',
          'shadow-none', // Removed heavy shadow for full-bleed feel
          'bg-transparent', // Ensures no white frames ever compress the map!
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default DashboardMapCard;
