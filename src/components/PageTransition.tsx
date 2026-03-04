/**
 * PAGE TRANSITIONS — 2026 Emotional Design
 *
 * Magical, staggered entrance / graceful exit animations that make every
 * navigation feel alive and intentional.
 *
 * DESIGN PHILOSOPHY:
 *   Opening feels like the page "comes alive" in waves — elements rise
 *   gracefully from below with spring physics, gentle blur clearing, and
 *   progressive delays so content arrives in natural visual order.
 *
 *   Closing is always faster than opening: a quick scale-down + fade so
 *   users never feel trapped waiting for an exit animation.
 *
 * SPRING PHYSICS:
 *   We use framer-motion springs (stiffness 280–380, damping 22–28) rather
 *   than CSS easing functions. Springs produce an organic, confident motion
 *   that CSS timing functions can't replicate — there's a brief overshoot
 *   (1–2%) that reads as "alive" without feeling bouncy or cartoonish.
 *
 * EXPORTS:
 *   PageTransition      — wraps a full page / route; many animation variants
 *   StaggerContainer    — container that staggers Framer Motion children
 *   StaggerItem         — individual item inside StaggerContainer
 *   ModalTransition     — wraps modals / sheets; scale-up entrance
 *   StaggerSection      — CSS-only stagger via .stagger-enter class
 *                         (use when Framer Motion isn't available in subtree)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

// ── SPRING CONFIGS ────────────────────────────────────────────────────────────

// Primary page spring — confident, just a hair of overshoot
const PAGE_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 26,
  mass: 0.85,
};

// Stagger child spring — slightly bouncier for individual elements
const CHILD_SPRING = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 24,
  mass: 0.75,
};

// Exit transition — always fast so it never feels sluggish
const EXIT_FAST = {
  duration: 0.16,
  ease: [0.4, 0, 1, 1] as const,
};

// ── PAGE VARIANT MAP ──────────────────────────────────────────────────────────
// Each variant controls enter/exit behaviour for different navigation contexts.

const defaultVariants = {
  initial: { opacity: 0 },
  in:      { opacity: 1 },
  out:     { opacity: 0, transition: EXIT_FAST },
};

/** Horizontal slide — great for sibling routes (settings, profile, etc.) */
const slideVariants = {
  initial: { opacity: 0, x: 48, scale: 0.97 },
  in:      { opacity: 1, x: 0,  scale: 1 },
  out:     { opacity: 0, x: -32, scale: 0.98, transition: EXIT_FAST },
};

/** Zoom + blur — striking entrance for dashboards / home screens */
const scaleVariants = {
  initial: { opacity: 0, scale: 0.88, filter: 'blur(10px)' },
  in:      { opacity: 1, scale: 1,    filter: 'blur(0px)' },
  out:     { opacity: 0, scale: 1.04, filter: 'blur(5px)', transition: EXIT_FAST },
};

/** Pure fade — fastest, least disruptive */
const fadeVariants = {
  initial: { opacity: 0 },
  in:      { opacity: 1 },
  out:     { opacity: 0, transition: EXIT_FAST },
};

/**
 * SLIDE UP — 2026 "coming alive" entrance
 *
 * The main variant for most page / screen transitions.
 * Elements rise from 28px below with a spring overshoot, while blur
 * clears simultaneously — the combination reads as content becoming
 * tangible rather than just fading in.
 */
const slideUpVariants = {
  initial: {
    opacity: 0,
    y: 28,
    scale: 0.96,
    filter: 'blur(8px) saturate(110%)',
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px) saturate(100%)',
    transition: PAGE_SPRING,
  },
  out: {
    opacity: 0,
    y: -16,
    scale: 0.97,
    filter: 'blur(4px)',
    transition: EXIT_FAST,
  },
};

/** Morph-in — organic entrance that "uncrumples" from a rounded collapsed state */
const morphInVariants = {
  initial: { opacity: 0, scale: 0.91, borderRadius: '28px', filter: 'blur(12px)' },
  in:      { opacity: 1, scale: 1,    borderRadius: '0px',  filter: 'blur(0px)' },
  out:     { opacity: 0, scale: 0.97, filter: 'blur(6px)',  transition: EXIT_FAST },
};

/**
 * SPRING ALIVE — the definitive 2026 page open animation
 *
 * Combines:
 *   - Rise from below (y: 32 → 0) with spring overshoot
 *   - Blur clear (8px → 0) so the page appears to materialise
 *   - Subtle scale (0.95 → 1) for depth
 *   - Fast, elegant exit (scale + fade, no downward movement)
 *
 * Use this for: new pages, modals opening, detail screens
 */
const springAliveVariants = {
  initial: {
    opacity: 0,
    y: 32,
    scale: 0.95,
    filter: 'blur(10px) saturate(115%)',
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px) saturate(100%)',
    transition: {
      ...PAGE_SPRING,
      stiffness: 280,
      damping: 22,
    },
  },
  out: {
    opacity: 0,
    scale: 0.97,
    y: -8,
    filter: 'blur(6px)',
    transition: EXIT_FAST,
  },
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

/**
 * PageTransition
 *
 * Wrap a full page or route outlet to apply enter/exit animations.
 * Already used in AnimatedOutlet.tsx for router-level transitions.
 * Use this directly inside pages for section-level transitions.
 *
 * @example
 * // In a page component:
 * <PageTransition variant="springAlive">
 *   <div className="flex flex-col gap-4">...</div>
 * </PageTransition>
 */
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
    >
      {children}
    </motion.div>
  );
}

// ── STAGGER CONTAINER ─────────────────────────────────────────────────────────

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  /**
   * Delay between each child's animation start (seconds).
   * Default 0.055 (55ms) — creates a natural, readable wave.
   * Use 0.04 for dense lists, 0.08 for spaced-out hero sections.
   */
  staggerDelay?: number;
  /** Extra delay before the first child starts (seconds) */
  delayChildren?: number;
}

/**
 * StaggerContainer + StaggerItem
 *
 * Use these together to create the staggered "coming alive" entrance
 * where each element appears in a graceful wave.
 *
 * @example
 * <StaggerContainer>
 *   <StaggerItem><ProfileCard /></StaggerItem>
 *   <StaggerItem><ActionButtons /></StaggerItem>
 *   <StaggerItem><InfoSection /></StaggerItem>
 * </StaggerContainer>
 *
 * The three items will rise in with 55ms between each,
 * creating the premium "wave" entrance effect.
 */
export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.055,
  delayChildren = 0.05,
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
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
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
  /**
   * Additional y-offset to rise from (default 20px).
   * Use larger values for hero elements, smaller for list items.
   */
  yOffset?: number;
}

/**
 * StaggerItem — individual animated item inside StaggerContainer.
 *
 * Spring physics: stiffness 360 / damping 24 gives a ~1% overshoot
 * which reads as organic and alive without being bouncy.
 */
export function StaggerItem({
  children,
  className = '',
  yOffset = 20,
}: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          y: yOffset,
          scale: 0.97,
          filter: 'blur(4px)',
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          transition: CHILD_SPRING,
        },
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
  /**
   * 'sheet'  — slides up from bottom (default for bottom sheets, drawers)
   * 'dialog' — scales up from centre (for centred dialogs)
   * 'fade'   — simple fade for overlays
   */
  variant?: 'sheet' | 'dialog' | 'fade';
}

const modalVariants = {
  sheet: {
    initial: { opacity: 0, y: 60, scale: 0.96 },
    in:      { opacity: 1, y: 0,  scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 340,
        damping: 28,
        mass: 0.8,
      },
    },
    out:     { opacity: 0, y: 40, scale: 0.97, transition: EXIT_FAST },
  },
  dialog: {
    initial: { opacity: 0, scale: 0.88, filter: 'blur(8px)' },
    in:      { opacity: 1, scale: 1,    filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        stiffness: 380,
        damping: 26,
        mass: 0.7,
      },
    },
    out:     { opacity: 0, scale: 0.93, filter: 'blur(4px)', transition: EXIT_FAST },
  },
  fade: {
    initial: { opacity: 0 },
    in:      { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' as const } },
    out:     { opacity: 0, transition: EXIT_FAST },
  },
};

/**
 * ModalTransition
 *
 * Wrap modal / dialog / sheet content to get a premium entrance.
 *
 * @example
 * // Bottom sheet
 * <AnimatePresence>
 *   {isOpen && (
 *     <ModalTransition variant="sheet" key="my-sheet">
 *       <MySheetContent />
 *     </ModalTransition>
 *   )}
 * </AnimatePresence>
 *
 * // Centred dialog
 * <AnimatePresence>
 *   {isOpen && (
 *     <ModalTransition variant="dialog" key="my-dialog">
 *       <MyDialogContent />
 *     </ModalTransition>
 *   )}
 * </AnimatePresence>
 */
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

/**
 * StaggerSection
 *
 * CSS-only stagger utility — no Framer Motion required in children.
 * Applies `.stagger-enter` which uses CSS `@keyframes stagger-item-enter`
 * with nth-child delays defined in premium-polish.css.
 *
 * Use when you need stagger but cannot restructure children as StaggerItem.
 *
 * @example
 * <StaggerSection>
 *   <div>Section one</div>
 *   <div>Section two</div>
 *   <div>Section three</div>
 * </StaggerSection>
 */
export function StaggerSection({ children, className = '' }: StaggerSectionProps) {
  return (
    <div className={`stagger-enter ${className}`}>
      {children}
    </div>
  );
}
