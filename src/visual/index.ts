/**
 * Premium Visual System
 * Cinematic luxury + SaaS polish
 *
 * Export all visual components and utilities
 */

// Core engine
export { VisualEngine, ReactiveBackground } from "./VisualEngine";

// Motion configuration
export {
  premiumEasing,
  cinematicEasing,
  pageTransition,
  microInteraction,
  cinematicTransition,
  ambientMotion,
  hoverScale,
  tapScale,
  motionVariants,
  getTransitionDuration,
  type AnimationLevel,
} from "./MotionConfig";

// Transition components
export {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "./PageTransition";

// Button components
export {
  PremiumButton,
  IconButton,
  FloatingActionButton,
} from "./PremiumButton";

// Card components
export {
  PremiumCard,
  SwipeCard,
  FeatureCard,
  GlowCard,
} from "./PremiumCard";

// Micro-interactions
export {
  PressableArea,
  ScaleOnHover,
  FadeIn,
  SlideIn,
  PulseGlow,
  FloatEffect,
  ShimmerEffect,
} from "./MicroInteractions";

// Settings UI
export { VisualPreferencesSettings } from "./VisualPreferencesSettings";
