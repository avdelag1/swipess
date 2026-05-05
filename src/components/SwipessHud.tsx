import React from 'react';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useChromeReveal, revealChrome } from '@/hooks/useChromeReveal';

interface SwipessHudProps {
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
  /**
   * When true, visibility is controlled by the chrome-reveal store
   * (hidden by default, revealed via summon zones, auto-hides after 5s).
   * Overrides alwaysVisible.
   */
  revealMode?: boolean;
}

/**
 * 🧘 SWIPESS HUD WRAPPER
 * Automatically hides/shows its children based on scroll direction and idle focus mode.
 * Use this for headers, footers, and floating buttons to create an immersive experience.
 */
export function SwipessHud({
  children,
  scrollTargetSelector,
  threshold = 20,
  mode = 'both',
  side = 'top',
  className,
  alwaysVisible = false,
  revealMode = false,
}: SwipessHudProps) {
  const location = useLocation();
  const { isFocused } = useFocusMode(7000);

  const { isVisible: isScrollVisible } = useScrollDirection({
    threshold,
    showAtTop: true,
    targetSelector: scrollTargetSelector,
    resetTrigger: location.pathname
  });

  const { isChromeVisible } = useChromeReveal();
  const isVisible = revealMode ? isChromeVisible : (alwaysVisible || isScrollVisible);

  const isTranslate = mode === 'both' || mode === 'translate';
  const isFade = mode === 'both' || mode === 'fade';

  const fullyHidden = revealMode && !isVisible;
  return (
    <div
      className={cn(
        "pointer-events-none will-change-transform",
        !isVisible && isFade && "opacity-0",
        !isVisible && isTranslate && side === 'top' && "-translate-y-[120%]",
        !isVisible && isTranslate && side === 'bottom' && "translate-y-[120%]",
        isVisible && "opacity-100 translate-y-0 blur-0 scale-100",
        !isVisible && "blur-md scale-[0.98]",
        className
      )}
      style={{
        willChange: 'transform, opacity, filter',
        transitionProperty: 'transform, opacity, filter',
        transitionDuration: isVisible ? '520ms' : '420ms',
        transitionTimingFunction: isVisible
          ? 'cubic-bezier(0.22, 1, 0.36, 1)' // expo-out — silky entrance
          : 'cubic-bezier(0.7, 0, 0.84, 0)',  // expo-in — quick exit
        visibility: fullyHidden ? 'hidden' : 'visible',
        pointerEvents: fullyHidden ? 'none' : undefined,
      }}
      aria-hidden={fullyHidden || undefined}
      {...(fullyHidden ? { inert: '' as any } : {})}
      onPointerDownCapture={revealMode && isVisible ? () => revealChrome() : undefined}
    >
      {children}
    </div>
  );
}


