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
 * TOP GRADIENT MASK - STRONG CONTRAST FOR HEADER UI
 *
 * Creates darkness at top for header elements contrast.
 */
export const GradientMaskTop = memo(function GradientMaskTop({
  intensity = 1,
  className = '',
  zIndex = 15,
  light = false,
  heightPercent = 20,
}: GradientMaskProps) {
  const baseColor = light ? '255,255,255' : '0,0,0';

  // STRONG GRADIENT: 75% at top edge
  const style: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: `${heightPercent}%`,
    // Strong gradient for header contrast
    background: `linear-gradient(
      to bottom,
      rgba(${baseColor}, ${0.75 * intensity}) 0%,
      rgba(${baseColor}, ${0.5 * intensity}) 15%,
      rgba(${baseColor}, ${0.25 * intensity}) 40%,
      rgba(${baseColor}, ${0.1 * intensity}) 65%,
      rgba(${baseColor}, 0) 90%,
      rgba(${baseColor}, 0) 100%
    )`,
    transform: 'translateZ(0)',
    willChange: 'opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    pointerEvents: 'none',
    zIndex,
    paddingTop: 'env(safe-area-inset-top, 0px)',
  };

  return <div className={className} style={style} aria-hidden="true" />;
});

/**
 * BOTTOM GRADIENT MASK - STRONG CONTRAST FOR WHITE UI
 *
 * Creates deep darkness at bottom for button/text contrast.
 * White elements must pop against this.
 */
export const GradientMaskBottom = memo(function GradientMaskBottom({
  intensity = 1,
  className = '',
  zIndex = 20,
  light = false,
  heightPercent = 45,
}: GradientMaskProps) {
  const baseColor = light ? '255,255,255' : '0,0,0';

  // STRONG GRADIENT: 85% opacity at bottom edge for white UI contrast
  const style: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: `${heightPercent}%`,
    // Strong gradient for white text/button contrast
    background: `linear-gradient(
      to top,
      rgba(${baseColor}, ${0.85 * intensity}) 0%,
      rgba(${baseColor}, ${0.6 * intensity}) 20%,
      rgba(${baseColor}, ${0.35 * intensity}) 45%,
      rgba(${baseColor}, ${0.15 * intensity}) 70%,
      rgba(${baseColor}, ${0.05 * intensity}) 85%,
      rgba(${baseColor}, 0) 100%
    )`,
    transform: 'translateZ(0)',
    willChange: 'opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    pointerEvents: 'none',
    zIndex,
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
