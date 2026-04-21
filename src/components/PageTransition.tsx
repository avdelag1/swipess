/**
 * PAGE TRANSITIONS — Performance-First Design
 *
 * All variants use ONLY opacity + transform (translate/scale).
 * NO filter: blur() — it's the single most expensive CSS property
 * to animate and causes visible jank on mobile/PWA.
 *
 * Springs produce organic motion without blur.
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// ── SPRING CONFIGS ────────────────────────────────────────────────────────────

const PAGE_SPRING = {
  type: 'spring' as const,
  stiffness: 450, // Ultra-snappy
  damping: 32,
  mass: 0.6,
};

const CHILD_SPRING = {
  type: 'spring' as const,
  stiffness: 550, // Tactile snap
  damping: 34,
  mass: 0.5,
};

const EXIT_FAST = {
  duration: 0.08, // Near-instant exit
  ease: [0.4, 0, 1, 1] as const,
};

// ── VARIANT MAP ───────────────────────────────────────────────────────────────

const defaultVariants = {
  initial: { opacity: 0 },
  in:      { opacity: 1 },
  out:     { opacity: 0, transition: EXIT_FAST },
};

const slideVariants = {
  initial: { opacity: 0, x: 36, scale: 0.98 },
  in:      { opacity: 1, x: 0,  scale: 1 },
  out:     { opacity: 0, x: -24, scale: 0.99, transition: EXIT_FAST },
};

const scaleVariants = {
  initial: { opacity: 0, scale: 0.92 },
  in:      { opacity: 1, scale: 1 },
  out:     { opacity: 0, scale: 1.03, transition: EXIT_FAST },
};

const fadeVariants = {
  initial: { opacity: 0 },
  in:      { opacity: 1 },
  out:     { opacity: 0, transition: EXIT_FAST },
};

const slideUpVariants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  in:      { opacity: 1, y: 0,  scale: 1, transition: PAGE_SPRING },
  out:     { opacity: 0, y: -10, scale: 0.98, transition: EXIT_FAST },
};

const morphInVariants = {
  initial: { opacity: 0, scale: 0.93, borderRadius: '28px' },
  in:      { opacity: 1, scale: 1,    borderRadius: '0px' },
  out:     { opacity: 0, scale: 0.97, transition: EXIT_FAST },
};

const springAliveVariants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  in: {
    opacity: 1, y: 0, scale: 1,
    transition: { ...PAGE_SPRING, stiffness: 320, damping: 24 },
  },
  out: { opacity: 0, scale: 0.98, y: -6, transition: EXIT_FAST },
};

const variantMap = {
  default:     defaultVariants,
  slide:       slideVariants,
  scale:       scaleVariants,
  fade:        fadeVariants,
  slideUp:     slideUpVariants,
  morphIn:     morphInVariants,
  springAlive: springAliveVariants,
};

// ── PAGE TRANSITION ───────────────────────────────────────────────────────────

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variantMap;
}

export function PageTransition({
  children,
  className = '',
  variant = 'springAlive',
}: PageTransitionProps) {
  const variants = variantMap[variant];
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={prefersReduced ? false : 'initial'}
      animate="in"
      exit="out"
      variants={variants}
      transition={prefersReduced ? { duration: 0 } : PAGE_SPRING}
      className={`w-full h-full ${className}`}
      style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
    >
      {children}
    </motion.div>
  );
}

// ── STAGGER CONTAINER ─────────────────────────────────────────────────────────

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.045,
  delayChildren = 0.03,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={className}
      variants={{
        hidden:  { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── STAGGER ITEM ──────────────────────────────────────────────────────────────

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  yOffset?: number;
}

export function StaggerItem({
  children,
  className = '',
  yOffset = 16,
}: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden:  { opacity: 0, y: yOffset, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: CHILD_SPRING },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── MODAL TRANSITION ──────────────────────────────────────────────────────────

interface ModalTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: 'sheet' | 'dialog' | 'fade';
}

const modalVariants = {
  sheet: {
    initial: { opacity: 0, y: 48, scale: 0.97 },
    in:      { opacity: 1, y: 0,  scale: 1,
      transition: { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.7 },
    },
    out:     { opacity: 0, y: 32, scale: 0.98, transition: EXIT_FAST },
  },
  dialog: {
    initial: { opacity: 0, scale: 0.90 },
    in:      { opacity: 1, scale: 1,
      transition: { type: 'spring' as const, stiffness: 420, damping: 28, mass: 0.65 },
    },
    out:     { opacity: 0, scale: 0.94, transition: EXIT_FAST },
  },
  fade: {
    initial: { opacity: 0 },
    in:      { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' as const } },
    out:     { opacity: 0, transition: EXIT_FAST },
  },
};

export function ModalTransition({
  children,
  className = '',
  variant = 'sheet',
}: ModalTransitionProps) {
  const mv = modalVariants[variant];
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={prefersReduced ? false : 'initial'}
      animate="in"
      exit="out"
      variants={mv as any}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

// ── STAGGER SECTION (CSS-only) ────────────────────────────────────────────────

interface StaggerSectionProps {
  children: ReactNode;
  className?: string;
}

export function StaggerSection({ children, className = '' }: StaggerSectionProps) {
  return (
    <div className={`stagger-enter ${className}`}>
      {children}
    </div>
  );
}

