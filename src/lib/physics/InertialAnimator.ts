/**
 * INERTIAL ANIMATOR - Post-Release Physics
 *
 * Handles the animation after finger release using true physics simulation.
 *
 * Modes:
 * 1. INERTIA - Friction-based deceleration (iOS scroll feel)
 * 2. SPRING - Critically damped spring for snap-back
 * 3. SNAP - Combination of inertia followed by spring snap
 *
 * This replaces CSS animations and Framer Motion's built-in animations
 * for gesture-driven interactions where physics accuracy matters.
 */

import {
  IOS_PHYSICS,
  applyFrictionDecay,
  calculateSpringForce,
  predictEndPosition,
  FrameTimer,
} from './PhysicsEngine';

export type AnimationMode = 'inertia' | 'spring' | 'snap';

export interface AnimationState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  scale: number;
  opacity: number;
}

export interface AnimationConfig {
  // Mode
  mode: AnimationMode;

  // Target position (for spring/snap modes)
  targetX?: number;
  targetY?: number;

  // Inertia settings
  decelerationRate?: number;

  // Spring settings
  springStiffness?: number;
  springDamping?: number;
  springMass?: number;

  // Snap settings (inertia first, then spring)
  snapThreshold?: number; // Distance from target to switch to spring

  // Bounds (for rubber-band effect)
  bounds?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };

  // Animation constraints
  maintainRotation?: boolean;
  rotationFactor?: number;
  scaleFactor?: number;
  opacityFactor?: number;

  // Exit animation (swipe out)
  exitDistance?: number;
  isExitAnimation?: boolean;
}

const DEFAULT_CONFIG: AnimationConfig = {
  mode: 'inertia',
  decelerationRate: IOS_PHYSICS.DECELERATION_RATE,
  springStiffness: IOS_PHYSICS.SNAP_SPRING.stiffness,
  springDamping: IOS_PHYSICS.SNAP_SPRING.damping,
  springMass: IOS_PHYSICS.SNAP_SPRING.mass,
  snapThreshold: 50,
  maintainRotation: false,
  rotationFactor: 0.1,
  scaleFactor: 0.0005,
  opacityFactor: 0.002,
  exitDistance: 500,
  isExitAnimation: false,
};

export interface AnimationCallbacks {
  onFrame?: (state: AnimationState) => void;
  onComplete?: (state: AnimationState) => void;
  onPassThreshold?: (direction: 'left' | 'right') => void;
}

export class InertialAnimator {
  private config: AnimationConfig;
  private state: AnimationState;
  private timer: FrameTimer;
  private callbacks: AnimationCallbacks;
  private hasPassedThreshold = false;

  constructor(
    initialState: Partial<AnimationState> = {},
    config: Partial<AnimationConfig> = {},
    callbacks: AnimationCallbacks = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      ...initialState,
    };
    this.timer = new FrameTimer();
    this.callbacks = callbacks;
  }

  /**
   * Start animation with current state and velocity
   */
  start(
    initialVelocityX: number,
    initialVelocityY: number,
    callbacks?: AnimationCallbacks
  ): void {
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    this.state.velocityX = initialVelocityX;
    this.state.velocityY = initialVelocityY;
    this.hasPassedThreshold = false;

    this.timer.start(this.tick);
  }

  /**
   * Stop animation immediately
   */
  stop(): void {
    this.timer.stop();
  }

  /**
   * Update configuration mid-animation
   */
  updateConfig(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current state
   */
  getState(): AnimationState {
    return { ...this.state };
  }

  /**
   * Check if animating
   */
  isAnimating(): boolean {
    return this.timer.isRunning();
  }

  /**
   * Main animation tick - called every frame
   */
  private tick = (dt: number): boolean => {
    const { mode } = this.config;

    switch (mode) {
      case 'inertia':
        return this.tickInertia(dt);
      case 'spring':
        return this.tickSpring(dt);
      case 'snap':
        return this.tickSnap(dt);
      default:
        return false;
    }
  };

  /**
   * Inertia mode - pure friction decay
   */
  private tickInertia(dt: number): boolean {
    const { decelerationRate, isExitAnimation, exitDistance = 500 } = this.config;

    // Apply friction decay to X
    const resultX = applyFrictionDecay(
      this.state.x,
      this.state.velocityX,
      dt,
      decelerationRate
    );
    this.state.x = resultX.position;
    this.state.velocityX = resultX.velocity;

    // Apply friction decay to Y
    const resultY = applyFrictionDecay(
      this.state.y,
      this.state.velocityY,
      dt,
      decelerationRate
    );
    this.state.y = resultY.position;
    this.state.velocityY = resultY.velocity;

    // Update rotation/scale/opacity based on X position
    this.updateSecondaryProperties();

    // Check bounds
    this.enforceBounds(dt);

    // Notify
    this.callbacks.onFrame?.(this.state);

    // Check threshold
    this.checkThreshold();

    // Check if done - for exit animations, also stop when far enough off-screen
    let done = resultX.stopped && resultY.stopped;

    if (!done && this.config.isExitAnimation && this.config.exitDistance) {
      const distanceTraveled = Math.abs(this.state.x);
      // Force completion when card has traveled 1.2x the exit distance
      if (distanceTraveled >= this.config.exitDistance * 1.2) {
        done = true;
      }
    }

    if (done) {
      this.callbacks.onComplete?.(this.state);
    }

    return !done;
  }

  /**
   * Spring mode - damped spring to target
   */
  private tickSpring(dt: number): boolean {
    const { targetX = 0, targetY = 0 } = this.config;
    const dtSeconds = dt / 1000;

    // Calculate spring force for X
    const springConfig = {
      stiffness: Number(this.config.springStiffness) || 400,
      damping: Number(this.config.springDamping) || 35,
      mass: Number(this.config.springMass) || 0.5,
    };
    
    const forceX = calculateSpringForce(
      this.state.x,
      targetX,
      this.state.velocityX,
      springConfig
    );

    // Calculate spring force for Y
    const forceY = calculateSpringForce(
      this.state.y,
      targetY,
      this.state.velocityY,
      springConfig
    );

    // Apply forces
    this.state.velocityX += forceX.force * dtSeconds;
    this.state.velocityY += forceY.force * dtSeconds;
    this.state.x += this.state.velocityX * dtSeconds;
    this.state.y += this.state.velocityY * dtSeconds;

    // Update rotation/scale/opacity
    this.updateSecondaryProperties();

    // Notify
    this.callbacks.onFrame?.(this.state);

    // Check threshold
    this.checkThreshold();

    // Check if done
    const done = forceX.isAtRest && forceY.isAtRest;
    if (done) {
      // Snap to exact target
      this.state.x = targetX;
      this.state.y = targetY;
      this.state.velocityX = 0;
      this.state.velocityY = 0;

      if (targetX === 0 && targetY === 0) {
        this.state.rotation = 0;
        this.state.scale = 1;
        this.state.opacity = 1;
      }

      this.callbacks.onComplete?.(this.state);
    }

    return !done;
  }

  /**
   * Snap mode - inertia until near target, then spring
   */
  private tickSnap(dt: number): boolean {
    const { targetX = 0, targetY = 0, snapThreshold = 50 } = this.config;

    // Check if we're close enough to switch to spring
    const distanceToTarget = Math.sqrt(
      Math.pow(this.state.x - targetX, 2) + Math.pow(this.state.y - targetY, 2)
    );

    if (distanceToTarget < snapThreshold) {
      // Switch to spring mode for final approach
      this.config.mode = 'spring';
      return this.tickSpring(dt);
    }

    // Otherwise, continue with inertia
    return this.tickInertia(dt);
  }

  /**
   * Update rotation, scale, opacity based on X position
   */
  private updateSecondaryProperties(): void {
    const { rotationFactor, scaleFactor, opacityFactor, isExitAnimation, exitDistance } =
      this.config;

    if (isExitAnimation) {
      // Exit animation - more dramatic rotation, fade out
      const progress = Math.min(Math.abs(this.state.x) / (exitDistance || 500), 1);
      this.state.rotation = Math.sign(this.state.x) * progress * 20;
      this.state.scale = 1 - progress * 0.15;
      this.state.opacity = 1 - progress * 0.4;
    } else {
      // Normal animation - subtle effects
      this.state.rotation = this.state.x * (rotationFactor || 0);
      this.state.scale = Math.max(0.9, 1 - Math.abs(this.state.x) * (scaleFactor || 0));
      this.state.opacity = Math.max(0.6, 1 - Math.abs(this.state.x) * (opacityFactor || 0));
    }
  }

  /**
   * Enforce bounds with rubber-band effect
   */
  private enforceBounds(dt: number): void {
    const { bounds } = this.config;
    if (!bounds) return;

    const { minX, maxX, minY, maxY } = bounds;

    // Check X bounds
    if (minX !== undefined && this.state.x < minX) {
      // Bounce back
      this.state.x = minX;
      this.state.velocityX = -this.state.velocityX * 0.3;
    } else if (maxX !== undefined && this.state.x > maxX) {
      this.state.x = maxX;
      this.state.velocityX = -this.state.velocityX * 0.3;
    }

    // Check Y bounds
    if (minY !== undefined && this.state.y < minY) {
      this.state.y = minY;
      this.state.velocityY = -this.state.velocityY * 0.3;
    } else if (maxY !== undefined && this.state.y > maxY) {
      this.state.y = maxY;
      this.state.velocityY = -this.state.velocityY * 0.3;
    }
  }

  /**
   * Check if we've passed the swipe threshold
   */
  private checkThreshold(): void {
    if (this.hasPassedThreshold) return;

    const { exitDistance = 500, isExitAnimation } = this.config;
    if (!isExitAnimation) return;

    const threshold = exitDistance * 0.5;

    if (Math.abs(this.state.x) > threshold) {
      this.hasPassedThreshold = true;
      this.callbacks.onPassThreshold?.(this.state.x > 0 ? 'right' : 'left');
    }
  }
}

/**
 * Create an animator for swipe exit animation
 * Uses higher velocity and minimal friction for smooth, continuous exit
 */
export function createExitAnimator(
  startX: number,
  startY: number,
  velocityX: number,
  velocityY: number,
  direction: 'left' | 'right',
  onFrame: (state: AnimationState) => void,
  onComplete: () => void
): InertialAnimator {
  const exitDistance = 500;
  const targetX = direction === 'right' ? exitDistance : -exitDistance;

  // Boost velocity significantly for smooth, fast exit that doesn't pull back
  // Higher minimum velocity prevents the "hesitation" feeling
  const minExitVelocity = 1200;
  let boostedVelocityX = velocityX;

  // Ensure velocity is always in the swipe direction and fast enough
  if (Math.abs(velocityX) < minExitVelocity || Math.sign(velocityX) !== Math.sign(targetX)) {
    boostedVelocityX = Math.sign(targetX) * minExitVelocity;
  }

  // If user had good momentum, preserve it but ensure minimum
  if (Math.sign(velocityX) === Math.sign(targetX)) {
    boostedVelocityX = Math.sign(targetX) * Math.max(Math.abs(velocityX), minExitVelocity);
  }

  return new InertialAnimator(
    { x: startX, y: startY, rotation: 0, scale: 1, opacity: 1 },
    {
      mode: 'inertia',
      isExitAnimation: true,
      exitDistance,
      // Very low friction - almost no deceleration so card flows smoothly off screen
      decelerationRate: 0.9995,
    },
    { onFrame, onComplete }
  );
}

/**
 * Create an animator for snap-back animation
 * Uses a softer, more gentle spring for natural feel without harsh pull-back
 */
export function createSnapBackAnimator(
  startX: number,
  startY: number,
  velocityX: number,
  velocityY: number,
  onFrame: (state: AnimationState) => void,
  onComplete: () => void
): InertialAnimator {
  return new InertialAnimator(
    { x: startX, y: startY, rotation: startX * 0.1, scale: 1, opacity: 1 },
    {
      mode: 'spring',
      targetX: 0,
      targetY: 0,
      // Softer spring - less stiff, higher damping for smooth return without harsh snap
      springStiffness: 280,
      springDamping: 28,
      springMass: 0.6,
    },
    { onFrame, onComplete }
  );
}
