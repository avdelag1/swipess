import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PremiumLoader } from '../PremiumLoader';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

// Track if the app has already performed its initial cold-boot load
let isColdBoot = true;

/**
 * SMART SUSPENSE FALLBACK
 * Optimized for Tinder-speed navigation.
 * 1. Cold boot: Shows the premium black splash screen loader.
 * 2. In-app navigation (hot): Initially invisible for 250ms to eliminate 
      the "flicker" on fast navigations. 
 * 3. Slow navigation: If navigation takes >250ms, shows a subtle blur + loader
      so the user knows the app is still alive.
 */
export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  const [showSubtleLoader, setShowSubtleLoader] = useState(false);

  useEffect(() => {
    if (!isColdBoot && !minimal) {
      const timer = setTimeout(() => setShowSubtleLoader(true), 250);
      return () => clearTimeout(timer);
    }
  }, [minimal]);

  // After first mount, mark cold boot as false
  if (isColdBoot) {
    // Shorter timeout - 1s is enough to mark it as not fresh boot
    setTimeout(() => { isColdBoot = false; }, 1000);
  }

  // If minimal, it's just a spacer/skeleton fallback
  if (minimal) {
    return (
      <div className={cn("h-full w-full flex items-center justify-center bg-background/20", className)}>
        <PremiumLoader size="sm" />
      </div>
    );
  }

  // HOT NAV: Transparent for the first 250ms, then a subtle loader if it's slow
  if (!isColdBoot) {
    return (
      <div className={cn(
        "fixed inset-0 z-[5000] flex items-center justify-center transition-opacity duration-300",
        showSubtleLoader ? "bg-background/40 backdrop-blur-sm opacity-100" : "bg-transparent opacity-0 pointer-events-none"
      )} aria-hidden="true">
        {showSubtleLoader && <PremiumLoader size="md" />}
      </div>
    );
  }

  // COLD BOOT: Full splash version - fixed, pure black, no scrollbars
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#000000] overflow-hidden overscroll-none touch-none',
        className
      )}
      aria-hidden="true"
    >
      <PremiumLoader size="lg" />
    </div>
  );
}

export default SuspenseFallback;
