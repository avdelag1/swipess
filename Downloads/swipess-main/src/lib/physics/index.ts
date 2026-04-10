/**
 * PHYSICS LIBRARY - Apple-Grade Interaction Physics
 *
 * This library provides true physical simulation for gestures and animations.
 *
 * Core modules:
 * - PhysicsEngine: Core physics math (friction, springs, prediction)
 * - GesturePredictor: Velocity tracking and intent detection
 * - InertialAnimator: Post-release animation with friction/spring
 * - usePhysicsGesture: React hook for complete gesture handling
 *
 * Key principles:
 * 1. Direct manipulation - objects attached to finger
 * 2. Velocity prediction - accurate from gesture history
 * 3. Friction decay - iOS-style deceleration
 * 4. Spring physics - critically damped for smooth snap
 * 5. Zero React in hot path - refs and DOM manipulation only
 */

// Core physics
export {
  IOS_PHYSICS,
  calculateVelocity,
  applyFrictionDecay,
  calculateSpringForce,
  rubberBand,
  predictEndPosition,
  timeToReachPosition,
  detectIntent,
  FrameTimer,
  type TimestampedPoint,
  type Velocity,
  type PhysicsState,
  type GestureIntent,
} from './PhysicsEngine';

// Gesture prediction
export {
  GesturePredictor,
  acquirePredictor,
  releasePredictor,
  type GestureState,
  type GesturePredictorConfig,
} from './GesturePredictor';

// Inertial animation
export {
  InertialAnimator,
  createExitAnimator,
  createSnapBackAnimator,
  type AnimationMode,
  type AnimationState,
  type AnimationConfig,
  type AnimationCallbacks,
} from './InertialAnimator';

// React hook
export {
  usePhysicsGesture,
  type PhysicsGestureConfig,
  type PhysicsGestureState,
  type PhysicsGestureResult,
} from './usePhysicsGesture';
