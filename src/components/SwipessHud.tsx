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

/** Soft glass vanish — opacity-led, tiny drift, no hard snap off-screen. */
const SOFT_EASE = [0.22, 0.61, 0.36, 1] as const;
const HIDE_MS = 0.32;
const SHOW_MS = 0.38;

export function SwipessHud({
  children,
  scrollTargetSelector,
  threshold = 28,
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

  const yHide = side === 'top' ? -12 : 14;

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
        filter: isVisible ? 'blur(0px)' : 'blur(6px)',
      }}
      transition={{
        duration: isVisible ? SHOW_MS : HIDE_MS,
        ease: SOFT_EASE,
        opacity: { duration: isVisible ? SHOW_MS : HIDE_MS * 0.9 },
        filter: { duration: isVisible ? SHOW_MS * 0.85 : HIDE_MS },
      }}
      style={{
        pointerEvents: isVisible ? undefined : 'none',
        willChange: 'opacity, transform, filter',
      }}
      aria-hidden={!isVisible || undefined}
      {...(!isVisible ? { inert: '' as any } : {})}
      onPointerDownCapture={isVisible ? () => revealChrome() : undefined}
    >
      <div className="relative">{children}</div>
    </motion.div>
  );
}
