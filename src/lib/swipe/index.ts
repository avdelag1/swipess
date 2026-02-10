/**
 * Ultra-Fast Swipe Engine Library
 *
 * High-performance swipe components for Tinder-level responsiveness.
 * Zero perceptible latency - card moves within 16ms of touch.
 */

// Core engine
export { SwipeEngine, createSwipeEngine } from './SwipeEngine';
export type { SwipeEngineConfig, SwipeState } from './SwipeEngine';

// Background processing
export { swipeQueue, useSwipeQueue } from './SwipeQueue';

// Image preloading
export { imagePreloadController, ImagePreloadController } from './ImagePreloadController';
export type { ImageEntry } from './ImagePreloadController';

// Card stack
export { RecyclingCardStack } from './RecyclingCardStack';
export type { RecyclingCardStackProps, RecyclingCardStackHandle, CardData } from './RecyclingCardStack';
