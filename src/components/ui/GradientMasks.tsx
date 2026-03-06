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
  heightPercent = 24,
}: GradientMaskProps) {
  const baseColor = light ? '255,255,255' : '0,0,0';
  const lightDim = light ? 0.08 : 1; // Ultra-subtle in light mode to avoid haze

  const style: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: `${heightPercent}%`,
    background: `linear-gradient(
      to bottom,
      rgba(${baseColor}, ${0.35 * intensity * lightDim}) 0%,
      rgba(${baseColor}, ${0.22 * intensity * lightDim}) 15%,
      rgba(${baseColor}, ${0.12 * intensity * lightDim}) 35%,
      rgba(${baseColor}, ${0.06 * intensity * lightDim}) 55%,
      rgba(${baseColor}, ${0.02 * intensity * lightDim}) 75%,
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
  heightPercent = 40,
}: GradientMaskProps) {
  const baseColor = light ? '255,255,255' : '0,0,0';
  const lightDim = light ? 0.08 : 1;

  const style: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: `${heightPercent}%`,
    background: `linear-gradient(
      to top,
      rgba(${baseColor}, ${0.4 * intensity * lightDim}) 0%,
      rgba(${baseColor}, ${0.25 * intensity * lightDim}) 12%,
      rgba(${baseColor}, ${0.14 * intensity * lightDim}) 30%,
      rgba(${baseColor}, ${0.07 * intensity * lightDim}) 50%,
      rgba(${baseColor}, ${0.02 * intensity * lightDim}) 70%,
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
 * GLOBAL VIGNETTE - CINEMATIC SCREEN DEPTH
 * 
 * Recreates the filmic corner shading but with theme-awareness.
 * In light theme, it uses extremely subtle grey tones to maintain depth without feeling "dirty".
 */
export const GlobalVignette = memo(function GlobalVignette({
  intensity = 1,
  className = '',
  light = false,
}: Omit<GradientMaskProps, 'zIndex' | 'heightPercent'>) {
  const baseColor = light ? '100,100,100' : '0,0,0';
  const alphaMultipiler = light ? 0.05 : 1;

  const style: CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1, // Above background, below all content
    /* Intensified dark shade on all 4 corners + subtle top/bottom edge bands */
    background: `
      radial-gradient(ellipse 70% 35% at 0% 0%, rgba(${baseColor}, ${0.12 * intensity * alphaMultipiler}) 0%, transparent 100%),
      radial-gradient(ellipse 70% 35% at 100% 0%, rgba(${baseColor}, ${0.12 * intensity * alphaMultipiler}) 0%, transparent 100%),
      radial-gradient(ellipse 70% 35% at 0% 100%, rgba(${baseColor}, ${0.12 * intensity * alphaMultipiler}) 0%, transparent 100%),
      radial-gradient(ellipse 70% 35% at 100% 100%, rgba(${baseColor}, ${0.12 * intensity * alphaMultipiler}) 0%, transparent 100%)
    `,
    /* Inner shadow for additional edge depth */
    boxShadow: `inset 0 0 80px rgba(${baseColor}, ${0.08 * intensity * alphaMultipiler})`,
    opacity: 1,
    transform: 'translateZ(0)',
  };

  return <div className={className} style={style} aria-hidden="true" />;
});

/**
 * FULL GRADIENT OVERLAY
 *
 * Combines top, bottom, and vignette for a complete flagship look.
 */
export const GradientOverlay = memo(function GradientOverlay({
  intensity = 1,
  className = '',
  light = false,
}: Omit<GradientMaskProps, 'zIndex' | 'heightPercent'>) {
  return (
    <div className={className} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* Background vignette sits deeper */}
      <GlobalVignette intensity={intensity} light={light} />

      {/* Functional gradients for UI contrast sit higher */}
      <GradientMaskTop intensity={intensity} light={light} zIndex={15} />
      <GradientMaskBottom intensity={intensity} light={light} zIndex={20} />
    </div>
  );
});
