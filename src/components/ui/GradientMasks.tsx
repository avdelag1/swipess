/**
 * GRADIENT MASK SYSTEM - CURVED SCREEN EFFECT
 *
 * Creates the Tinder-style curved vignette effect that persists
 * across all pages for a consistent floating UI experience.
 *
 * Features:
 * - GPU-friendly (uses opacity + transform only)
 * - pointer-events: none (clicks pass through)
 * - Smooth curved gradient that simulates screen curvature
 * - Supports both light and dark themes
 * - Works on ALL pages for consistent navigation contrast
 */

import { memo, CSSProperties } from 'react';

interface GradientMaskProps {
  /** Intensity of the gradient (0-1). Default 1 = full opacity */
  intensity?: number;
  /** Additional className for custom styling */
  className?: string;
  /** Z-index for layering (default 15 for top, 20 for bottom) */
  zIndex?: number;
  /** Use light theme (white gradient instead of black) */
  light?: boolean;
  /** Extend height percentage (default: 28% for top, 45% for bottom) */
  heightPercent?: number;
}

/**
 * TOP GRADIENT MASK - CURVED SCREEN EFFECT
 *
 * Creates a subtle curved shadow at the top of the screen:
 * - Darkest at the very top edge (simulates screen curve)
 * - Smooth gradient fade to transparent
 * - Provides contrast for TopBar UI elements
 */
export const GradientMaskTop = memo(function GradientMaskTop({
  intensity = 1,
  className = '',
  zIndex = 15,
  light = false,
  heightPercent = 28,
}: GradientMaskProps) {
  const baseColor = light ? '255,255,255' : '0,0,0';

  const style: CSSProperties = {
    position: 'fixed', // Fixed to persist across scroll
    top: 0,
    left: 0,
    right: 0,
    height: `${heightPercent}%`,
    // CURVED SCREEN gradient: Strong edge, smooth curved fade
    background: `linear-gradient(
      to bottom,
      rgba(${baseColor}, ${0.85 * intensity}) 0%,
      rgba(${baseColor}, ${0.65 * intensity}) 15%,
      rgba(${baseColor}, ${0.40 * intensity}) 35%,
      rgba(${baseColor}, ${0.18 * intensity}) 60%,
      rgba(${baseColor}, ${0.05 * intensity}) 80%,
      rgba(${baseColor}, 0) 100%
    )`,
    // GPU acceleration
    transform: 'translateZ(0)',
    willChange: 'opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    // Click-through
    pointerEvents: 'none',
    zIndex,
    // Safe area support
    paddingTop: 'env(safe-area-inset-top, 0px)',
  };

  return <div className={className} style={style} aria-hidden="true" />;
});

/**
 * BOTTOM GRADIENT MASK - CURVED SCREEN EFFECT
 *
 * Creates a subtle curved shadow at the bottom of the screen:
 * - Darkest at the very bottom edge (simulates screen curve)
 * - Smooth gradient fade to transparent
 * - Provides contrast for navigation and swipe buttons
 */
export const GradientMaskBottom = memo(function GradientMaskBottom({
  intensity = 1,
  className = '',
  zIndex = 20,
  light = false,
  heightPercent = 50,
}: GradientMaskProps) {
  const baseColor = light ? '255,255,255' : '0,0,0';

  const style: CSSProperties = {
    position: 'fixed', // Fixed to persist across scroll
    bottom: 0,
    left: 0,
    right: 0,
    height: `${heightPercent}%`,
    // CURVED SCREEN gradient: Strong edge at bottom, smooth curved fade upward
    background: `linear-gradient(
      to top,
      rgba(${baseColor}, ${0.90 * intensity}) 0%,
      rgba(${baseColor}, ${0.75 * intensity}) 10%,
      rgba(${baseColor}, ${0.55 * intensity}) 25%,
      rgba(${baseColor}, ${0.30 * intensity}) 45%,
      rgba(${baseColor}, ${0.10 * intensity}) 65%,
      rgba(${baseColor}, 0) 100%
    )`,
    // GPU acceleration
    transform: 'translateZ(0)',
    willChange: 'opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    // Click-through
    pointerEvents: 'none',
    zIndex,
    // Safe area support
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  };

  return <div className={className} style={style} aria-hidden="true" />;
});

/**
 * FULL GRADIENT OVERLAY
 *
 * Combines both top and bottom masks for a complete "vignette" effect.
 * Use this when you want both gradients as a single component.
 */
export const GradientOverlay = memo(function GradientOverlay({
  intensity = 1,
  className = '',
  light = false,
}: Omit<GradientMaskProps, 'zIndex' | 'heightPercent'>) {
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <GradientMaskTop intensity={intensity} light={light} />
      <GradientMaskBottom intensity={intensity} light={light} />
    </div>
  );
});
