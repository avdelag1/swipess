/**
 * Ultra-Fast Spring Physics Configurations
 * Lightning-fast, buttery smooth animations with zero perceptible delay
 * Optimized for instant response and seamless transitions
 *
 * These configs are for Framer Motion springs.
 * For gesture physics, use the physics library: @/lib/physics
 */

import { IOS_PHYSICS } from '@/lib/physics';

// Re-export iOS physics constants for convenience
export { IOS_PHYSICS };

export const springConfigs = {
  // Instant - Zero perceptible delay, immediate response
  instant: {
    type: 'spring' as const,
    stiffness: 2500,
    damping: 80,
    mass: 0.01,
  },

  // Touch - Finger-attached feel, no lag whatsoever
  touch: {
    type: 'spring' as const,
    stiffness: 3000,
    damping: 90,
    mass: 0.02,
  },

  // GameLike - Ultra-responsive for swipe cards and interactive elements
  gameLike: {
    type: 'spring' as const,
    stiffness: 2800,
    damping: 75,
    mass: 0.03,
  },

  // SnapBack - Instant return to origin
  snapBack: {
    type: 'spring' as const,
    stiffness: 2600,
    damping: 70,
    mass: 0.03,
  },

  // Snappy - Quick responses for buttons, hovers, micro-interactions
  snappy: {
    type: 'spring' as const,
    stiffness: 1800,
    damping: 60,
    mass: 0.08,
  },

  // UltraSmooth - Navigation and page changes with no jank
  ultraSmooth: {
    type: 'spring' as const,
    stiffness: 1200,
    damping: 55,
    mass: 0.12,
  },

  // Smooth - Page transitions and major UI changes
  smooth: {
    type: 'spring' as const,
    stiffness: 900,
    damping: 50,
    mass: 0.18,
  },

  // Bouncy - Subtle bounce for cards, modals appearing
  bouncy: {
    type: 'spring' as const,
    stiffness: 800,
    damping: 25,
    mass: 0.2,
  },

  // Gentle - Large content blocks, lists
  gentle: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 40,
    mass: 0.25,
  },

  // Wobbly - Attention-grabbing elements (rarely used)
  wobbly: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
    mass: 0.3,
  },
} as const;

// Ultra-fast easing curves for non-spring animations
export const easingCurves = {
  // iOS-like snappy - extremely responsive
  iOS: [0.25, 0.8, 0.25, 1] as [number, number, number, number],

  // Material Design - fast and smooth
  material: [0.4, 0, 0.1, 1] as [number, number, number, number],

  // Instant entrance - no delay
  entrance: [0, 0, 0.15, 1] as [number, number, number, number],

  // Quick exit
  exit: [0.3, 0, 1, 1] as [number, number, number, number],

  // Emphasized - for important interactions
  emphasized: [0.05, 0.8, 0.1, 1] as [number, number, number, number],

  // Linear for constant animations
  linear: [0, 0, 1, 1] as [number, number, number, number],
} as const;

// Ultra-fast duration presets (in seconds) - imperceptible delays
export const durations = {
  instant: 0.05,   // 50ms - virtually instant
  fast: 0.08,      // 80ms - extremely fast
  normal: 0.12,    // 120ms - still very fast
  slow: 0.18,      // 180ms - for larger transitions
  verySlow: 0.25,  // 250ms - maximum for any animation
} as const;

// Pre-configured transition objects for common use cases
export const transitions = {
  // For micro-interactions (hover, focus, tap)
  micro: {
    type: 'spring' as const,
    ...springConfigs.instant,
  },

  // For UI element state changes
  state: {
    type: 'spring' as const,
    ...springConfigs.snappy,
  },

  // For page/view transitions
  page: {
    type: 'spring' as const,
    ...springConfigs.ultraSmooth,
  },

  // For modal/overlay appearances
  overlay: {
    type: 'spring' as const,
    ...springConfigs.smooth,
  },

  // For card interactions
  card: {
    type: 'spring' as const,
    ...springConfigs.gameLike,
  },
} as const;

/**
 * iOS-style gesture physics presets
 * Based on UIScrollView deceleration rates
 */
export const gesturePhysics = {
  // Normal deceleration (like UIScrollViewDecelerationRateNormal)
  normal: {
    decelerationRate: IOS_PHYSICS.DECELERATION_RATE,
    springStiffness: IOS_PHYSICS.SNAP_SPRING.stiffness,
    springDamping: IOS_PHYSICS.SNAP_SPRING.damping,
    springMass: IOS_PHYSICS.SNAP_SPRING.mass,
  },

  // Fast deceleration (like UIScrollViewDecelerationRateFast)
  fast: {
    decelerationRate: IOS_PHYSICS.DECELERATION_RATE_FAST,
    springStiffness: 500,
    springDamping: 40,
    springMass: 0.4,
  },

  // Heavy feel - slower to stop, more momentum
  heavy: {
    decelerationRate: 0.999,
    springStiffness: 350,
    springDamping: 30,
    springMass: 0.7,
  },

  // Light feel - stops quickly, snappy
  light: {
    decelerationRate: 0.995,
    springStiffness: 600,
    springDamping: 45,
    springMass: 0.3,
  },

  // Swipe cards - optimized for Tinder-style swiping
  // Softer spring for gentle snap-back, minimal friction for smooth exit
  swipeCard: {
    decelerationRate: 0.9995,
    springStiffness: 280,
    springDamping: 28,
    springMass: 0.6,
    swipeThreshold: 120,
    velocityThreshold: 400,
    minExitVelocity: 1200,
  },
} as const;
