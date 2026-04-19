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
      className="w-full relative flex items-stretch justify-center px-3 sm:px-5 md:px-8 py-2 sm:py-3 md:py-4"
      style={{
        height:
          'calc(100dvh - var(--top-bar-height) - var(--bottom-nav-height) - var(--safe-top, 0px) - var(--safe-bottom, 0px))',
      }}
    >
      <div
        className={cn(
          'w-full max-w-[1200px] h-full rounded-3xl overflow-hidden flex flex-col relative',
          'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]',
          isLight
            ? 'bg-white border border-black/5'
            : 'bg-[#0f0f12] border border-white/10',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default DashboardMapCard;
