import React, { } from 'react';
import { motion } from 'framer-motion';
import { useFocusMode } from '@/hooks/useFocusMode';
import { DASHBOARD_CHROME_SCROLL_KEY, useScrollDirection } from '@/hooks/useScrollDirection';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { revealChrome, useChromeReveal } from '@/hooks/useChromeReveal';

interface SwipessHudProps {
  children: React.ReactNode;
  scrollTargetSelector?: string;
  threshold?: number;
  mode?: 'translate' | 'fade' | 'both';
  side?: 'top' | 'bottom';
  className?: string;
  alwaysVisible?: boolean;
  revealMode?: boolean;
  pointerEvents?: 'none' | 'auto';
}

/**
 * Fixed chrome fade — soft Casper ghost: opacity + light translate only.
 * No blur / layout collapse (those made the dashboard deck feel yanked).
 */
const SOFT_EASE = [0.25, 0.1, 0.25, 1] as const;
const HIDE_MS = 0.34;
const SHOW_MS = 0.36;

export function SwipessHud({
  children,
  scrollTargetSelector,
  threshold = 36,
  mode: _mode = 'both',
  side = 'top',
  className,
  alwaysVisible = false,
  revealMode = false,
  pointerEvents = 'none',
}: SwipessHudProps) {
  const location = useLocation();
  const { _isFocused } = useFocusMode(7000);

  const { isVisible: isScrollVisible } = useScrollDirection({
    threshold,
    showAtTop: true,
    targetSelector: scrollTargetSelector || '.dashboard-scroll-target',
    resetTrigger: location.pathname,
    sharedKey: DASHBOARD_CHROME_SCROLL_KEY,
  });

  const { isChromeVisible } = useChromeReveal();
  const isVisible = revealMode ? isChromeVisible : (alwaysVisible || isScrollVisible);

  // Soft drift only — fixed chrome must never affect document flow / card positions
  const yHide = side === 'top' ? -8 : 10;

  return (
    <motion.div
      className={cn(
        pointerEvents === 'none' ? 'pointer-events-none' : 'pointer-events-auto',
        'relative',
        className,
      )}
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : yHide,
      }}
      transition={{
        duration: isVisible ? SHOW_MS : HIDE_MS,
        ease: SOFT_EASE,
      }}
      style={{
        pointerEvents: isVisible ? undefined : 'none',
        willChange: 'opacity, transform',
      }}
      aria-hidden={!isVisible || undefined}
      {...(!isVisible ? { inert: '' as any } : {})}
      onPointerDownCapture={isVisible ? () => revealChrome() : undefined}
    >
      <div className="relative">{children}</div>
    </motion.div>
  );
}
