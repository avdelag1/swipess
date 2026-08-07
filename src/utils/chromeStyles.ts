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
 * Bottom dock chrome.
 *
 * - **Dashboard**: always dark bar + white icons (swipe deck photos need contrast).
 * - **Elsewhere**: adapts to light/dark theme filter — light gets a *dark* glass
 *   dock so icons stay readable; dark theme stays charcoal glass + white icons.
 * Icons are always frameless (no circular discs).
 */
export function getBottomNavChrome(isLight: boolean, isDashboard = false) {
  // Dashboard + dark UI → white icons on dark dock.
  // Light UI off-dashboard → dark icons on a tinted dark dock (high contrast).
  // We never use a near-white dock: icons become invisible.
  const forceDarkDock = isDashboard || !isLight;
  const useLightIcons = forceDarkDock; // white icons on dark dock

  const darkDock: CSSProperties = {
    background:
      'linear-gradient(165deg, rgba(22,22,28,0.92) 0%, rgba(10,10,14,0.88) 55%, rgba(8,8,12,0.94) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderTop: '1px solid rgba(255, 255, 255, 0.28)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    boxShadow: [
      '0 12px 36px rgba(0, 0, 0, 0.45)',
      '0 2px 8px rgba(0, 0, 0, 0.25)',
      'inset 0 1px 0 rgba(255,255,255,0.18)',
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

  // Light theme off-dashboard: slightly softer charcoal (not pure white)
  const lightThemeDock: CSSProperties = {
    ...darkDock,
    background:
      'linear-gradient(165deg, rgba(28,28,34,0.90) 0%, rgba(14,14,18,0.86) 55%, rgba(10,10,14,0.92) 100%)',
  };

  const pillStyle = forceDarkDock ? darkDock : lightThemeDock;

  // Active = pure white; inactive = soft white (still readable on dark dock)
  const iconColor = '#FFFFFF';
  const inactiveIconColor = 'rgba(255,255,255,0.78)';

  return {
    useLightIcons,
    iconColor,
    inactiveIconColor,
    pillStyle,
    iconShadow: 'none',
  };
}

/** Always transparent — circular glass discs behind nav icons are forbidden. */
export function getGlassBubbleStyle(_isLight?: boolean, _active?: boolean): CSSProperties {
  return {
    background: 'transparent',
    boxShadow: 'none',
    border: 'none',
    borderRadius: '0',
  };
}

export function isDashboardPath(pathname: string) {
  return /\/(client|owner|admin)\/dashboard\/?/.test(pathname);
}