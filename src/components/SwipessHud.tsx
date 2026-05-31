import React, { } from 'react';
import { motion } from 'framer-motion';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useScrollDirection } from '@/hooks/useScrollDirection';
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
}

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
  const { _isFocused } = useFocusMode(7000);

  const { isVisible: isScrollVisible } = useScrollDirection({
    threshold,
    showAtTop: true,
    targetSelector: scrollTargetSelector,
    resetTrigger: location.pathname
  });

  const { isChromeVisible } = useChromeReveal();
  const isVisible = revealMode ? isChromeVisible : (alwaysVisible || isScrollVisible);

  // In revealMode use Framer Motion with the same animation as the action button bar:
  // opacity + blur + scale + subtle y shift — no full off-screen translate.
  if (revealMode) {
    const yHide = side === 'top' ? -20 : 20;
    return (
      <motion.div
        className={cn('pointer-events-none will-change-transform relative', className)}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : yHide,
        }}
        transition={{
          duration: isVisible ? 0.15 : 0.12,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        style={{ pointerEvents: isVisible ? undefined : 'none' }}
        aria-hidden={!isVisible || undefined}
        {...(!isVisible ? { inert: '' as any } : {})}
        onPointerDownCapture={isVisible ? () => revealChrome() : undefined}
      >
        <div className="relative">{children}</div>
      </motion.div>
    );
  }

  // Non-reveal mode: existing CSS transition behaviour (scroll-based hide).
  const isTranslate = mode === 'both' || mode === 'translate';
  const isFade = mode === 'both' || mode === 'fade';

  return (
    <div
      className={cn(
        'pointer-events-none will-change-transform relative',
        !isVisible && isFade && 'opacity-0',
        !isVisible && isTranslate && side === 'top' && '-translate-y-[120%]',
        !isVisible && isTranslate && side === 'bottom' && 'translate-y-[120%]',
        isVisible && 'opacity-100 translate-y-0',
        !isVisible && 'scale-[0.94]',
        className
      )}
      style={{
        willChange: 'transform, opacity',
        transitionProperty: 'transform, opacity',
        transitionDuration: isVisible ? '180ms' : '150ms',
        transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        visibility: !isVisible ? 'hidden' : 'visible',
        pointerEvents: !isVisible ? 'none' : undefined,
      }}
      aria-hidden={!isVisible || undefined}
      {...(!isVisible ? { inert: '' as any } : {})}
      onPointerDownCapture={isVisible ? () => revealChrome() : undefined}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
