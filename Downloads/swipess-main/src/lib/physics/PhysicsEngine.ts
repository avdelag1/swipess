/**
 * PHYSICS ENGINE - Apple-Grade Interaction Physics
 *
 * This engine implements true physical simulation, not CSS animations.
 *
 * Core principles:
 * 1. Objects are ATTACHED to finger during drag (1:1 tracking)
 * 2. Velocity is PREDICTED from gesture history
 * 3. Release uses FRICTION DECAY, not spring animation
 * 4. Movement uses PROPER DELTA TIME, not fixed timestep
 * 5. All math is based on iOS UIScrollView physics constants
 *
 * Reference: iOS decelerationRate = 0.998 per millisecond
 * This means: velocity *= 0.998^dt where dt is in ms
 */

// iOS physics constants (empirically derived from UIScrollView)
export const IOS_PHYSICS = {
  // Friction coefficient - velocity decay per millisecond
  // iOS uses 0.998 for normal deceleration
  DECELERATION_RATE: 0.998,

  // Fast deceleration (like UIScrollViewDecelerationRateFast)
  DECELERATION_RATE_FAST: 0.99,

  // Minimum velocity before stopping (px/s)
  MIN_VELOCITY: 0.1,

  // Rubber band elasticity when pulling past bounds
  RUBBER_BAND_COEFFICIENT: 0.55,

  // Rubber band max stretch factor
  RUBBER_BAND_MAX: 0.35,

  // Snap velocity threshold (px/s) - below this, use spring snap
  SNAP_VELOCITY_THRESHOLD: 300,

  // Spring constants for snap-back animation
  SNAP_SPRING: {
    stiffness: 400,
    damping: 35,
    mass: 0.5,
  },

  // Velocity history window (ms)
  VELOCITY_WINDOW: 100,

  // Minimum samples for velocity calculation
  MIN_VELOCITY_SAMPLES: 3,
} as const;

// Point with timestamp for velocity tracking
export interface TimestampedPoint {
  x: number;
  y: number;
  t: number; // performance.now() timestamp
}

// Velocity vector
export interface Velocity {
  x: number; // px/s
  y: number; // px/s
  magnitude: number; // px/s
  angle: number; // radians
}

// Physics state
export interface PhysicsState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isAnimating: boolean;
  animationType: 'none' | 'inertia' | 'spring' | 'snap';
}

/**
 * Calculate velocity from a sliding window of points
 * Uses weighted average favoring recent samples
 */
export function calculateVelocity(
  history: TimestampedPoint[],
  currentPoint: TimestampedPoint,
  windowMs: number = IOS_PHYSICS.VELOCITY_WINDOW
): Velocity {
  // Filter points within the time window
  const cutoff = currentPoint.t - windowMs;
  const relevantPoints = history.filter(p => p.t >= cutoff);

  if (relevantPoints.length < IOS_PHYSICS.MIN_VELOCITY_SAMPLES - 1) {
    // Not enough samples - use simple two-point velocity
    if (history.length > 0) {
      const last = history[history.length - 1];
      const dt = (currentPoint.t - last.t) / 1000; // Convert to seconds
      if (dt > 0) {
        const vx = (currentPoint.x - last.x) / dt;
        const vy = (currentPoint.y - last.y) / dt;
        return {
          x: vx,
          y: vy,
          magnitude: Math.sqrt(vx * vx + vy * vy),
          angle: Math.atan2(vy, vx),
        };
      }
    }
    return { x: 0, y: 0, magnitude: 0, angle: 0 };
  }

  // Add current point
  const points = [...relevantPoints, currentPoint];

  // Calculate weighted velocity using recent samples
  // More weight to recent movements
  let totalWeight = 0;
  let weightedVx = 0;
  let weightedVy = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dt = (curr.t - prev.t) / 1000; // seconds

    if (dt > 0) {
      // Exponential weight - more recent = more weight
      const age = currentPoint.t - curr.t;
      const weight = Math.exp(-age / (windowMs * 0.5));

      const vx = (curr.x - prev.x) / dt;
      const vy = (curr.y - prev.y) / dt;

      weightedVx += vx * weight;
      weightedVy += vy * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight > 0) {
    const vx = weightedVx / totalWeight;
    const vy = weightedVy / totalWeight;
    return {
      x: vx,
      y: vy,
      magnitude: Math.sqrt(vx * vx + vy * vy),
      angle: Math.atan2(vy, vx),
    };
  }

  return { x: 0, y: 0, magnitude: 0, angle: 0 };
}

/**
 * Apply iOS-style exponential friction decay
 * Returns new position and velocity after dt milliseconds
 */
export function applyFrictionDecay(
  position: number,
  velocity: number,
  dt: number, // milliseconds
  decelerationRate: number = IOS_PHYSICS.DECELERATION_RATE
): { position: number; velocity: number; stopped: boolean } {
  // v(t) = v0 * r^t where r is deceleration rate, t in ms
  // x(t) = x0 + v0 * (r^t - 1) / ln(r)

  const lnR = Math.log(decelerationRate);
  const rT = Math.pow(decelerationRate, dt);

  const newVelocity = velocity * rT;
  const displacement = velocity * (rT - 1) / lnR;
  const newPosition = position + displacement / 1000; // Convert velocity from px/s

  const stopped = Math.abs(newVelocity) < IOS_PHYSICS.MIN_VELOCITY;

  return {
    position: newPosition,
    velocity: stopped ? 0 : newVelocity,
    stopped,
  };
}

/**
 * Calculate spring force for snap-back animation
 * Uses critically damped spring for smooth deceleration
 */
export function calculateSpringForce(
  currentPosition: number,
  targetPosition: number,
  velocity: number,
  config: { stiffness: number; damping: number; mass: number } = IOS_PHYSICS.SNAP_SPRING
): { force: number; isAtRest: boolean } {
  const displacement = targetPosition - currentPosition;
  const { stiffness, damping, mass } = config;

  // Spring force = -k * x - c * v
  const springForce = stiffness * displacement;
  const dampingForce = damping * velocity;
  const force = (springForce - dampingForce) / mass;

  // Check if at rest (both position and velocity near zero)
  const isAtRest = Math.abs(displacement) < 0.5 && Math.abs(velocity) < 0.5;

  return { force, isAtRest };
}

/**
 * Rubber band effect when pulling past bounds
 * Returns the visual position (less than actual drag distance)
 */
export function rubberBand(
  offset: number,
  dimension: number,
  coefficient: number = IOS_PHYSICS.RUBBER_BAND_COEFFICIENT
): number {
  // iOS rubber band formula: x = (1 - (1 / ((x * c / d) + 1))) * d
  // where x is offset, c is coefficient, d is dimension

  const sign = offset < 0 ? -1 : 1;
  const absOffset = Math.abs(offset);

  // Simplified rubber band formula
  const maxStretch = dimension * IOS_PHYSICS.RUBBER_BAND_MAX;
  const rubberBanded = maxStretch * (1 - 1 / (absOffset / maxStretch * coefficient + 1));

  return sign * Math.min(rubberBanded, absOffset);
}

/**
 * Predict where the gesture will end based on current velocity
 * Uses friction decay to calculate final resting position
 */
export function predictEndPosition(
  currentPosition: number,
  velocity: number,
  decelerationRate: number = IOS_PHYSICS.DECELERATION_RATE
): number {
  // Integral of v0 * r^t from 0 to infinity
  // = v0 / ln(1/r) = v0 / -ln(r)

  if (Math.abs(velocity) < IOS_PHYSICS.MIN_VELOCITY) {
    return currentPosition;
  }

  const lnR = Math.log(decelerationRate);
  const totalDisplacement = velocity / (-lnR * 1000); // Convert to pixels

  return currentPosition + totalDisplacement;
}

/**
 * Calculate time to reach a target position with friction
 * Returns Infinity if target won't be reached (wrong direction)
 */
export function timeToReachPosition(
  currentPosition: number,
  targetPosition: number,
  velocity: number,
  decelerationRate: number = IOS_PHYSICS.DECELERATION_RATE
): number {
  const displacement = targetPosition - currentPosition;

  // Check if we're moving toward target
  if (displacement * velocity < 0 || Math.abs(velocity) < IOS_PHYSICS.MIN_VELOCITY) {
    return Infinity;
  }

  // Solve: x0 + v0 * (r^t - 1) / ln(r) = target
  // (r^t - 1) = (target - x0) * ln(r) / v0
  // r^t = 1 + (target - x0) * ln(r) / v0 / 1000

  const lnR = Math.log(decelerationRate);
  const rT = 1 + (displacement * lnR * 1000) / velocity;

  if (rT <= 0) {
    return Infinity; // Won't reach
  }

  return Math.log(rT) / lnR;
}

/**
 * Detect gesture intent based on velocity and position
 */
export type GestureIntent =
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'tap'
  | 'drag'
  | 'cancel';

export function detectIntent(
  velocity: Velocity,
  displacement: { x: number; y: number },
  thresholds: {
    velocityThreshold?: number;
    distanceThreshold?: number;
  } = {}
): GestureIntent {
  const {
    velocityThreshold = 400,
    distanceThreshold = 80
  } = thresholds;

  const absVx = Math.abs(velocity.x);
  const absVy = Math.abs(velocity.y);
  const absDx = Math.abs(displacement.x);
  const absDy = Math.abs(displacement.y);

  // Check velocity-based swipe
  if (velocity.magnitude > velocityThreshold) {
    // Determine primary direction
    if (absVx > absVy * 1.5) {
      return velocity.x > 0 ? 'swipe-right' : 'swipe-left';
    } else if (absVy > absVx * 1.5) {
      return velocity.y > 0 ? 'swipe-down' : 'swipe-up';
    }
  }

  // Check distance-based swipe
  if (absDx > distanceThreshold && absDx > absDy * 1.5) {
    return displacement.x > 0 ? 'swipe-right' : 'swipe-left';
  }
  if (absDy > distanceThreshold && absDy > absDx * 1.5) {
    return displacement.y > 0 ? 'swipe-down' : 'swipe-up';
  }

  // If little movement, it's a tap
  if (absDx < 10 && absDy < 10 && velocity.magnitude < 50) {
    return 'tap';
  }

  // Otherwise it's just a drag that should cancel
  return 'cancel';
}

/**
 * High-resolution time tracker for consistent animation
 */
export class FrameTimer {
  private lastTime: number = 0;
  private frameCallback: ((dt: number) => boolean) | null = null;
  private rafId: number | null = null;

  start(callback: (dt: number) => boolean): void {
    this.stop();
    this.lastTime = performance.now();
    this.frameCallback = callback;
    this.tick();
  }

  private tick = (): void => {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    // Clamp dt to prevent huge jumps (e.g., after tab switch)
    const clampedDt = Math.min(dt, 32); // Max 32ms (30fps minimum)

    if (this.frameCallback) {
      const shouldContinue = this.frameCallback(clampedDt);
      if (shouldContinue) {
        this.rafId = requestAnimationFrame(this.tick);
      } else {
        this.rafId = null;
        this.frameCallback = null;
      }
    }
  };

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.frameCallback = null;
  }

  isRunning(): boolean {
    return this.rafId !== null;
  }
}
