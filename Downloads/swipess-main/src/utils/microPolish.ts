/**
 * MICRO-POLISH UTILITIES
 * 
 * Elite app details that users don't notice individually
 * but feel the difference immediately.
 * 
 * - Button press scale (0.96)
 * - Consistent timing
 * - Haptics tuned per action
 * - Scroll position memory
 */

import { triggerHaptic } from './haptics';

// ============================================
// BUTTON PRESS FEEDBACK
// ============================================

export const PRESS_SCALE = {
  button: 0.96,      // Standard buttons
  card: 0.98,        // Cards and larger elements
  icon: 0.92,        // Small icon buttons
  subtle: 0.99,      // Very subtle feedback
} as const;

// ============================================
// ANIMATION TIMING (iOS-inspired)
// ============================================

export const TIMING = {
  instant: 50,       // Immediate feedback
  fast: 100,         // Quick transitions
  normal: 200,       // Standard animations
  smooth: 300,       // Smooth transitions
  slow: 500,         // Deliberate animations
} as const;

// ============================================
// SPRING CONFIGURATIONS
// ============================================

export const SPRING = {
  snappy: { stiffness: 500, damping: 30, mass: 1 },
  bouncy: { stiffness: 400, damping: 25, mass: 1 },
  smooth: { stiffness: 300, damping: 30, mass: 1 },
  soft: { stiffness: 200, damping: 25, mass: 1 },
} as const;

// ============================================
// SKELETON SHIMMER TIMING
// ============================================

export const SKELETON = {
  duration: 1.5,     // Shimmer cycle duration in seconds
  delay: 0.1,        // Stagger delay between items
} as const;

// ============================================
// HAPTIC FEEDBACK HELPERS
// ============================================

export const haptics = {
  tap: () => triggerHaptic('light'),
  select: () => triggerHaptic('medium'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  match: () => triggerHaptic('match'),
  celebration: () => triggerHaptic('celebration'),
} as const;

// ============================================
// SCROLL POSITION MEMORY
// ============================================

const scrollPositions = new Map<string, number>();

export const scrollMemory = {
  save: (key: string, position: number) => {
    scrollPositions.set(key, position);
  },
  
  restore: (key: string): number => {
    return scrollPositions.get(key) || 0;
  },
  
  clear: (key: string) => {
    scrollPositions.delete(key);
  },
  
  clearAll: () => {
    scrollPositions.clear();
  },
};

// React hook helper for scroll memory
export const useScrollMemory = (key: string) => {
  return {
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      scrollMemory.save(key, e.currentTarget.scrollTop);
    },
    initialScrollTop: scrollMemory.restore(key),
  };
};

// ============================================
// KEYBOARD AVOIDANCE HELPER
// ============================================

export const getKeyboardHeight = (): number => {
  if (typeof window === 'undefined') return 0;
  
  // Check for visualViewport API (modern browsers)
  if (window.visualViewport) {
    const heightDiff = window.innerHeight - window.visualViewport.height;
    return heightDiff > 100 ? heightDiff : 0; // Only return if keyboard is likely open
  }
  
  return 0;
};

// ============================================
// PULL-TO-REFRESH PHYSICS
// ============================================

export const PULL_TO_REFRESH = {
  threshold: 80,           // Pixels to pull before triggering
  resistance: 2.5,         // How hard to pull (higher = harder)
  maxPull: 120,           // Maximum pull distance
  bounceBack: {
    stiffness: 500,
    damping: 30,
  },
} as const;

// ============================================
// STATUS BAR COLOR SYNC (for Capacitor)
// ============================================

export const setStatusBarColor = async (color: 'light' | 'dark') => {
  try {
    // Dynamic import to avoid errors on web
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: color === 'light' ? Style.Light : Style.Dark });
  } catch {
    // Not on native platform, ignore
  }
};

// ============================================
// ICON STROKE WIDTH CONSISTENCY
// ============================================

export const ICON_STROKE = {
  thin: 1.5,
  normal: 2,
  bold: 2.5,
} as const;

// ============================================
// FRAMER MOTION VARIANTS
// ============================================

export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideFromRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
} as const;

// ============================================
// PRESS ANIMATION PROPS (for motion components)
// ============================================

export const pressAnimation = {
  button: {
    whileTap: { scale: PRESS_SCALE.button },
    transition: { duration: TIMING.instant / 1000 },
  },
  card: {
    whileTap: { scale: PRESS_SCALE.card },
    transition: { duration: TIMING.instant / 1000 },
  },
  icon: {
    whileTap: { scale: PRESS_SCALE.icon },
    transition: { duration: TIMING.instant / 1000 },
  },
} as const;
