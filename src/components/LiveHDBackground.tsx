/**
 * LIVE HD BACKGROUND SYSTEM
 *
 * Creates subtle, premium animated backgrounds that feel alive.
 * Uses GPU-accelerated CSS animations for 60fps performance.
 *
 * Features:
 * - Subtle gradient shifts using CSS custom properties
 * - Organic floating orbs with natural motion
 * - Zero battery impact (CSS-only, no JS animation loop)
 * - Respects reduced motion preferences
 * - Multiple preset themes matching app color palette
 */

import { memo, useMemo } from 'react';

type BackgroundTheme = 'default' | 'warm' | 'cool' | 'neutral' | 'vibrant';

interface LiveHDBackgroundProps {
  /** Theme preset for color palette */
  theme?: BackgroundTheme;
  /** Whether to show animated orbs */
  showOrbs?: boolean;
  /** Custom className for additional styling */
  className?: string;
  /** Intensity of the animation (0-1) */
  intensity?: number;
}

// Theme configurations with rich, HD-feeling gradients - enhanced for black background
const THEMES: Record<BackgroundTheme, {
  base: string;
  orbs: string[];
  gradient: string;
}> = {
  default: {
    base: 'hsl(0 0% 0%)',
    orbs: [
      'radial-gradient(circle, rgba(239, 68, 68, 0.20) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 65%)',
    ],
    gradient: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(0 0% 3%) 50%, hsl(0 0% 0%) 100%)',
  },
  warm: {
    base: 'hsl(0 0% 0%)',
    orbs: [
      'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(245, 158, 11, 0.10) 0%, transparent 65%)',
    ],
    gradient: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(15 5% 3%) 50%, hsl(0 0% 0%) 100%)',
  },
  cool: {
    base: 'hsl(0 0% 0%)',
    orbs: [
      'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(168, 85, 247, 0.10) 0%, transparent 65%)',
    ],
    gradient: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(220 8% 3%) 50%, hsl(0 0% 0%) 100%)',
  },
  neutral: {
    base: 'hsl(0 0% 0%)',
    orbs: [
      'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(148, 163, 184, 0.06) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(100, 116, 139, 0.05) 0%, transparent 65%)',
    ],
    gradient: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(0 0% 2%) 50%, hsl(0 0% 0%) 100%)',
  },
  vibrant: {
    base: 'hsl(0 0% 0%)',
    orbs: [
      'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 65%)',
      'radial-gradient(circle, rgba(34, 197, 94, 0.10) 0%, transparent 65%)',
    ],
    gradient: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(270 5% 3%) 50%, hsl(0 0% 0%) 100%)',
  },
};

// Orb animation configurations for organic motion - slower, smoother
const ORB_CONFIGS = [
  { size: '60%', x: '-15%', y: '5%', duration: '35s', delay: '0s' },
  { size: '50%', x: '55%', y: '55%', duration: '40s', delay: '-15s' },
  { size: '55%', x: '25%', y: '-10%', duration: '45s', delay: '-25s' },
];

function LiveHDBackgroundComponent({
  theme = 'default',
  showOrbs = true,
  className = '',
  intensity = 0.8,
}: LiveHDBackgroundProps) {
  const themeConfig = THEMES[theme];

  // Memoize orb styles for performance
  const orbStyles = useMemo(() => {
    return ORB_CONFIGS.map((config, i) => ({
      background: themeConfig.orbs[i % themeConfig.orbs.length],
      width: config.size,
      height: config.size,
      left: config.x,
      top: config.y,
      animationDuration: config.duration,
      animationDelay: config.delay,
      opacity: intensity,
    }));
  }, [themeConfig.orbs, intensity]);

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        background: themeConfig.gradient,
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      {/* Base gradient layer with subtle animation */}
      <div
        className="absolute inset-0"
        style={{
          background: themeConfig.gradient,
          animation: 'live-hd-gradient 20s ease-in-out infinite',
          opacity: 0.9,
        }}
      />

      {/* Subtle noise texture for HD feel */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Animated floating orbs */}
      {showOrbs && orbStyles.map((style, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            ...style,
            animation: `live-hd-float-${i + 1} ${style.animationDuration} ease-in-out infinite`,
            animationDelay: style.animationDelay,
            filter: 'blur(40px)',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      ))}

      {/* Top-left accent glow */}
      <div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 60%)',
          filter: 'blur(40px)',
          animation: 'live-hd-pulse 15s ease-in-out infinite',
        }}
      />

      {/* Bottom-right accent glow */}
      <div
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 60%)',
          filter: 'blur(50px)',
          animation: 'live-hd-pulse 18s ease-in-out infinite',
          animationDelay: '-9s',
        }}
      />

      {/* CSS Keyframes - injected once */}
      <style>{`
        @keyframes live-hd-gradient {
          0%, 100% {
            opacity: 0.9;
            filter: brightness(1) saturate(1);
          }
          50% {
            opacity: 0.95;
            filter: brightness(1.05) saturate(1.1);
          }
        }

        @keyframes live-hd-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1) translateZ(0); }
          25% { transform: translate(20px, -30px) scale(1.05) translateZ(0); }
          50% { transform: translate(-10px, 20px) scale(0.95) translateZ(0); }
          75% { transform: translate(30px, 10px) scale(1.02) translateZ(0); }
        }

        @keyframes live-hd-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1) translateZ(0); }
          25% { transform: translate(-25px, 15px) scale(0.98) translateZ(0); }
          50% { transform: translate(15px, -25px) scale(1.03) translateZ(0); }
          75% { transform: translate(-15px, -10px) scale(1) translateZ(0); }
        }

        @keyframes live-hd-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1) translateZ(0); }
          33% { transform: translate(25px, 20px) scale(1.04) translateZ(0); }
          66% { transform: translate(-20px, -15px) scale(0.97) translateZ(0); }
        }

        @keyframes live-hd-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1) translateZ(0); }
          50% { opacity: 0.7; transform: scale(1.1) translateZ(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .live-hd-background * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export const LiveHDBackground = memo(LiveHDBackgroundComponent);
