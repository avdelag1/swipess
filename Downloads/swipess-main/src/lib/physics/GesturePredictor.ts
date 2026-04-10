/**
 * GESTURE PREDICTOR - Intent Detection Before Release
 *
 * This module predicts where the user intends to go BEFORE they release.
 * It uses a sliding window of touch positions to calculate accurate velocity
 * and predict the final resting position.
 *
 * Key features:
 * 1. Maintains velocity history for accurate calculation
 * 2. Predicts end position during drag (for visual feedback)
 * 3. Detects intent early (swipe vs. cancel)
 * 4. Filters noise from touch samples
 */

import {
  TimestampedPoint,
  Velocity,
  calculateVelocity,
  predictEndPosition,
  detectIntent,
  GestureIntent,
  IOS_PHYSICS,
} from './PhysicsEngine';

export interface GestureState {
  // Current position
  x: number;
  y: number;

  // Velocity (px/s)
  velocityX: number;
  velocityY: number;
  speed: number;

  // Predicted end position
  predictedEndX: number;
  predictedEndY: number;

  // Displacement from start
  deltaX: number;
  deltaY: number;

  // Intent detection
  intent: GestureIntent;
  intentConfidence: number; // 0-1

  // Timing
  duration: number; // ms since start
  lastUpdate: number; // timestamp
}

export interface GesturePredictorConfig {
  // Velocity window in milliseconds
  velocityWindowMs: number;

  // Minimum samples before velocity is considered reliable
  minSamples: number;

  // Thresholds for intent detection
  velocityThreshold: number; // px/s
  distanceThreshold: number; // px

  // Deceleration rate for prediction
  decelerationRate: number;

  // Enable noise filtering
  filterNoise: boolean;

  // Noise threshold (ignore movements smaller than this)
  noiseThreshold: number; // px
}

const DEFAULT_CONFIG: GesturePredictorConfig = {
  velocityWindowMs: IOS_PHYSICS.VELOCITY_WINDOW,
  minSamples: IOS_PHYSICS.MIN_VELOCITY_SAMPLES,
  velocityThreshold: 400,
  distanceThreshold: 80,
  decelerationRate: IOS_PHYSICS.DECELERATION_RATE,
  filterNoise: true,
  noiseThreshold: 2,
};

export class GesturePredictor {
  private config: GesturePredictorConfig;
  private history: TimestampedPoint[] = [];
  private startPoint: TimestampedPoint | null = null;
  private lastPoint: TimestampedPoint | null = null;
  private isTracking = false;

  // Cached velocity for performance
  private cachedVelocity: Velocity = { x: 0, y: 0, magnitude: 0, angle: 0 };
  private velocityCacheTime = 0;

  constructor(config: Partial<GesturePredictorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start tracking a new gesture
   */
  start(x: number, y: number): void {
    const now = performance.now();
    this.startPoint = { x, y, t: now };
    this.lastPoint = { x, y, t: now };
    this.history = [{ x, y, t: now }];
    this.isTracking = true;
    this.cachedVelocity = { x: 0, y: 0, magnitude: 0, angle: 0 };
    this.velocityCacheTime = now;
  }

  /**
   * Update with new touch position
   * Returns current gesture state
   */
  update(x: number, y: number): GestureState {
    if (!this.isTracking || !this.startPoint || !this.lastPoint) {
      return this.getEmptyState();
    }

    const now = performance.now();
    const currentPoint: TimestampedPoint = { x, y, t: now };

    // Noise filtering - ignore tiny movements
    if (this.config.filterNoise) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.config.noiseThreshold) {
        // Update time but keep position
        currentPoint.x = this.lastPoint.x;
        currentPoint.y = this.lastPoint.y;
      }
    }

    // Add to history
    this.history.push(currentPoint);

    // Trim old history (keep last 20 samples max for memory)
    const cutoff = now - this.config.velocityWindowMs * 2;
    this.history = this.history.filter(p => p.t >= cutoff);

    // Update last point
    this.lastPoint = currentPoint;

    // Calculate velocity (with caching - max 4ms between recalcs)
    if (now - this.velocityCacheTime > 4) {
      this.cachedVelocity = calculateVelocity(
        this.history.slice(0, -1),
        currentPoint,
        this.config.velocityWindowMs
      );
      this.velocityCacheTime = now;
    }

    // Calculate displacement
    const deltaX = x - this.startPoint.x;
    const deltaY = y - this.startPoint.y;

    // Predict end positions
    const predictedEndX = predictEndPosition(
      x,
      this.cachedVelocity.x,
      this.config.decelerationRate
    );
    const predictedEndY = predictEndPosition(
      y,
      this.cachedVelocity.y,
      this.config.decelerationRate
    );

    // Detect intent
    const intent = detectIntent(
      this.cachedVelocity,
      { x: deltaX, y: deltaY },
      {
        velocityThreshold: this.config.velocityThreshold,
        distanceThreshold: this.config.distanceThreshold,
      }
    );

    // Calculate intent confidence
    const intentConfidence = this.calculateConfidence(intent, deltaX, deltaY);

    return {
      x,
      y,
      velocityX: this.cachedVelocity.x,
      velocityY: this.cachedVelocity.y,
      speed: this.cachedVelocity.magnitude,
      predictedEndX,
      predictedEndY,
      deltaX,
      deltaY,
      intent,
      intentConfidence,
      duration: now - this.startPoint.t,
      lastUpdate: now,
    };
  }

  /**
   * End gesture tracking and get final state
   */
  end(): GestureState {
    if (!this.lastPoint) {
      return this.getEmptyState();
    }

    const state = this.update(this.lastPoint.x, this.lastPoint.y);
    this.isTracking = false;
    return state;
  }

  /**
   * Cancel gesture tracking
   */
  cancel(): void {
    this.isTracking = false;
    this.history = [];
    this.startPoint = null;
    this.lastPoint = null;
  }

  /**
   * Get current velocity without updating position
   */
  getVelocity(): Velocity {
    return { ...this.cachedVelocity };
  }

  /**
   * Check if currently tracking
   */
  isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get number of samples in history
   */
  getSampleCount(): number {
    return this.history.length;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GesturePredictorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Calculate confidence in intent detection (0-1)
   */
  private calculateConfidence(
    intent: GestureIntent,
    deltaX: number,
    deltaY: number
  ): number {
    if (intent === 'tap') {
      return 1.0;
    }

    if (intent === 'cancel') {
      return 0.0;
    }

    // For swipes, confidence is based on velocity and distance
    const isHorizontal = intent === 'swipe-left' || intent === 'swipe-right';
    const primaryVelocity = isHorizontal
      ? Math.abs(this.cachedVelocity.x)
      : Math.abs(this.cachedVelocity.y);
    const primaryDistance = isHorizontal ? Math.abs(deltaX) : Math.abs(deltaY);

    // Velocity confidence (0.5 weight)
    const velocityConfidence = Math.min(
      primaryVelocity / (this.config.velocityThreshold * 2),
      1.0
    );

    // Distance confidence (0.5 weight)
    const distanceConfidence = Math.min(
      primaryDistance / (this.config.distanceThreshold * 1.5),
      1.0
    );

    return velocityConfidence * 0.5 + distanceConfidence * 0.5;
  }

  /**
   * Get empty state for error cases
   */
  private getEmptyState(): GestureState {
    const now = performance.now();
    return {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      speed: 0,
      predictedEndX: 0,
      predictedEndY: 0,
      deltaX: 0,
      deltaY: 0,
      intent: 'cancel',
      intentConfidence: 0,
      duration: 0,
      lastUpdate: now,
    };
  }
}

/**
 * Singleton-style factory for gesture predictors
 * Reuses predictors to reduce GC pressure
 */
const predictorPool: GesturePredictor[] = [];
const activePool = new Set<GesturePredictor>();

export function acquirePredictor(
  config?: Partial<GesturePredictorConfig>
): GesturePredictor {
  let predictor = predictorPool.pop();

  if (!predictor) {
    predictor = new GesturePredictor(config);
  } else if (config) {
    predictor.updateConfig(config);
  }

  activePool.add(predictor);
  return predictor;
}

export function releasePredictor(predictor: GesturePredictor): void {
  if (activePool.has(predictor)) {
    predictor.cancel();
    activePool.delete(predictor);
    predictorPool.push(predictor);
  }
}
