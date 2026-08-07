import type { CSSProperties } from 'react';

export const HEADER_CHROME_PILL_CLASS = 'header-chrome-pill';

export const HEADER_PILL_BASE =
  `tap-css-only flex shrink-0 items-center justify-center rounded-full pointer-events-auto h-[32px] w-[32px] transition-all`;

export const HEADER_ICON = 'w-[16px] h-[16px]';

export type HeaderIconAccent = 'crown' | 'globe' | 'sparkles';

/** Depth shadow + optional accent glow for header HUD icons. */
export function getHeaderIconFilter(
  iconShadow: string,
  useLightIcons: boolean,
  accent?: HeaderIconAccent,
): string {
  return iconShadow;
}

/** Shared TopBar / nav pill + icon colors — dashboard swipe deck always uses light icons.
 *
 * iOS 26 LIQUID GLASS — key properties:
 *   • Ultra-heavy blur (40px) + high saturation (200%) — content behind the
 *     glass looks vivid and "enhanced", like seeing through a water lens
 *   • Very transparent fill — the glass is barely tinted so background colors
 *     bleed through
 *   • Thin luminous rim — a subtle white/cyan edge highlight that refracts
 *     light like actual glass
 *   • Delicate inner catch-light at top edge — no heavy neumorphic shadows
 */
export function getTopBarChrome(isLight: boolean, _isDashboard = false) {
  // Theme-aware: dark on light backgrounds, white on dark backgrounds
  const useLightIcons = !isLight; 

  const pillStyle: CSSProperties = {
    background: isLight 
      ? 'linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
      : 'linear-gradient(145deg, rgba(15,15,20,0.7) 0%, rgba(15,15,20,0.4) 100%)',
    border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.15)',
    borderTop: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.3)',
    borderLeft: isLight ? '1px solid rgba(255, 255, 255, 0.7)' : undefined,
    borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(32px) saturate(180%) contrast(110%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%) contrast(110%)',
    boxShadow: isLight 
      ? '0 8px 32px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255,255,255,0.8)'
      : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.15)',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: useLightIcons ? '#ffffff' : '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.12s ease-out',
    overflow: 'visible',
  };

  const iconColor = useLightIcons ? '#ffffff' : '#111111';
  const inactiveIconColor = useLightIcons ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)';

  return {
    useLightIcons,
    iconColor,
    inactiveIconColor,
    pillStyle,
    // No drop-shadow halos — they read as circular "discs" behind glyphs
    iconShadow: 'none',
  };
}

/**
 * Bottom dock — Apple-style liquid glass (glassmorphism).
 * Semi-transparent frost + heavy blur so map/UI color bleeds through;
 * luminous rim + soft float shadow. Icons stay sharp (no glyph drop-shadow).
 */
export function getBottomNavChrome(isLight: boolean, _isDashboard = false) {
  // Frosted glass works over light *and* dark UI — pick icon contrast from theme
  const useLightIcons = !isLight;

  const pillStyle: CSSProperties = isLight
    ? {
        // Light: bright liquid glass — readable over photos/maps
        background:
          'linear-gradient(165deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0.55) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        borderTop: '1px solid rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(48px) saturate(200%) brightness(1.06)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(1.06)',
        boxShadow: [
          '0 10px 36px rgba(15, 23, 42, 0.12)',
          '0 2px 8px rgba(15, 23, 42, 0.06)',
          'inset 0 1px 0 rgba(255,255,255,0.95)',
          'inset 0 -1px 0 rgba(255,255,255,0.25)',
        ].join(', '),
        borderRadius: '9999px',
        pointerEvents: 'auto',
        color: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease',
        overflow: 'visible',
        isolation: 'isolate',
      }
    : {
        // Dark: deep liquid glass with white rim catch-light
        background:
          'linear-gradient(165deg, rgba(40,42,52,0.55) 0%, rgba(18,18,24,0.48) 50%, rgba(12,12,16,0.58) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderTop: '1px solid rgba(255, 255, 255, 0.42)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(48px) saturate(200%) brightness(1.08)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(1.08)',
        boxShadow: [
          '0 12px 40px rgba(0, 0, 0, 0.38)',
          '0 2px 10px rgba(0, 0, 0, 0.22)',
          'inset 0 1px 0 rgba(255,255,255,0.28)',
          'inset 0 -1px 1px rgba(0,0,0,0.25)',
        ].join(', '),
        borderRadius: '9999px',
        pointerEvents: 'auto',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease',
        overflow: 'visible',
        isolation: 'isolate',
      };

  const iconColor = useLightIcons ? '#ffffff' : '#0F172A';
  const inactiveIconColor = useLightIcons
    ? 'rgba(255,255,255,0.72)'
    : 'rgba(15,23,42,0.48)';

  return {
    useLightIcons,
    iconColor,
    inactiveIconColor,
    pillStyle,
    iconShadow: 'none',
  };
}

/**
 * Per-button liquid glass highlight (active / add).
 * Soft frost capsule — not a heavy dark disc.
 */
export function getGlassBubbleStyle(isLight: boolean, active: boolean = false): CSSProperties {
  if (!active) {
    return {
      background: 'transparent',
      boxShadow: 'none',
      border: 'none',
      borderRadius: '9999px',
    };
  }

  if (isLight) {
    return {
      background:
        'linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.9)',
      boxShadow: [
        '0 4px 14px rgba(15, 23, 42, 0.10)',
        'inset 0 1px 0 rgba(255,255,255,1)',
        'inset 0 -1px 0 rgba(0,0,0,0.04)',
      ].join(', '),
      borderRadius: '9999px',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    };
  }

  return {
    background:
      'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.28)',
    boxShadow: [
      '0 4px 16px rgba(0, 0, 0, 0.25)',
      'inset 0 1px 0 rgba(255,255,255,0.45)',
      'inset 0 -1px 0 rgba(0,0,0,0.15)',
    ].join(', '),
    borderRadius: '9999px',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  };
}

export function isDashboardPath(pathname: string) {
  return /\/(client|owner|admin)\/dashboard\/?/.test(pathname);
}