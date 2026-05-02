import React from 'react';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SentientHudProps {
  children: React.ReactNode;
  /**
   * Selector for the scrollable element to monitor.
   * Defaults to window if not provided.
   */
  scrollTargetSelector?: string;
  /**
   * Hide threshold in pixels.
   */
  threshold?: number;
  /**
   * Type of movement ('translate' or 'fade')
   * Defaults to 'both'
   */
  mode?: 'translate' | 'fade' | 'both';
  /**
   * Direction to hide ('up' for headers, 'down' for footers)
   */
  side?: 'top' | 'bottom';
  className?: string;
  /** When true, always visible — no auto-hide on scroll */
  alwaysVisible?: boolean;
}

/**
 * 🧘 SENTIENT HUD WRAPPER
 * Automatically hides/shows its children based on scroll direction and idle focus mode.
 * Use this for headers, footers, and floating buttons to create an immersive experience.
 */
export function SentientHud({
  children,
  scrollTargetSelector,
  threshold = 20,
  mode = 'both',
  side = 'top',
  className,
  alwaysVisible = false,
}: SentientHudProps) {
  const location = useLocation();
  const { isFocused } = useFocusMode(7000);

  const { isVisible: isScrollVisible } = useScrollDirection({
    threshold,
    showAtTop: true,
    targetSelector: scrollTargetSelector,
    resetTrigger: location.pathname
  });

  const isVisible = alwaysVisible || isScrollVisible;

  const isTranslate = mode === 'both' || mode === 'translate';
  const isFade = mode === 'both' || mode === 'fade';

  return (
    <div 
      className={cn(
        "transition-all duration-500",
        // 🚀 ZENITH: Pointer-events Bypass Pattern
        // The container is fixed but must NEVER block touches to the content behind it.
        // We set pointer-events-none on the wrapper and pointer-events-auto on the children.
        "pointer-events-none",
        !isVisible && isFade && "opacity-0",
        !isVisible && isTranslate && side === 'top' && "-translate-y-full",
        !isVisible && isTranslate && side === 'bottom' && "translate-y-full",
        isVisible && "opacity-100 translate-y-0",
        className
      )}
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </div>
  );
}


