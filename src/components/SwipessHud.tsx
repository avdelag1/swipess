import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useChromeReveal, revealChrome } from '@/hooks/useChromeReveal';

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
  const { isFocused } = useFocusMode(7000);

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
    const yHide = side === 'top' ? -40 : 40;
    return (
      <motion.div
        className={cn('pointer-events-none will-change-transform relative', className)}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : yHide,
          filter: isVisible ? 'blur(0px)' : 'blur(12px)',
          scale: isVisible ? 1 : 0.94,
        }}
        transition={{
          duration: isVisible ? 0.68 : 1.4,
          ease: isVisible
            ? [0.22, 1.4, 0.36, 1]
            : [0.32, 0, 0.67, 0],
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
        isVisible && 'opacity-100 translate-y-0 blur-0 scale-100',
        !isVisible && 'blur-xl scale-[0.94]',
        className
      )}
      style={{
        willChange: 'transform, opacity, filter',
        transitionProperty: 'transform, opacity, filter',
        transitionDuration: isVisible ? '680ms' : '520ms',
        transitionTimingFunction: isVisible
          ? 'cubic-bezier(0.22, 1.4, 0.36, 1)'
          : 'cubic-bezier(0.32, 0, 0.67, 0)',
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
