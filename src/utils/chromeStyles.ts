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
    iconShadow: useLightIcons
      ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))'
      : 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
  };
}

export function getBottomNavChrome(isLight: boolean, _isDashboard = false) {
  // The bottom nav pill is always a dark glass gradient, so icons MUST always be light
  const useLightIcons = true;

  const pillStyle: CSSProperties = {
    background: _isDashboard 
      ? 'linear-gradient(145deg, rgba(10,10,12,0.82) 0%, rgba(10,10,12,0.65) 100%)'
      : 'linear-gradient(145deg, rgba(15,15,20,0.85) 0%, rgba(15,15,20,0.6) 100%)',
    border: _isDashboard ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.1)',
    borderTop: _isDashboard ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.2)',
    borderLeft: _isDashboard ? '1px solid rgba(255, 255, 255, 0.18)' : undefined,
    borderBottom: _isDashboard ? '1px solid rgba(0, 0, 0, 0.4)' : '1px solid rgba(0, 0, 0, 0.8)',
    backdropFilter: _isDashboard ? 'blur(40px) saturate(180%) contrast(110%)' : 'blur(40px) saturate(180%) contrast(110%)',
    WebkitBackdropFilter: _isDashboard ? 'blur(40px) saturate(180%) contrast(110%)' : 'blur(40px) saturate(180%) contrast(110%)',
    boxShadow: _isDashboard
      ? '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 6px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.5)'
      : '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.6)',
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
  const inactiveIconColor = useLightIcons ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.45)'; // Enhanced inactive whiteness

  return {
    useLightIcons,
    iconColor,
    inactiveIconColor,
    pillStyle,
    iconShadow: useLightIcons
      ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'
      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
  };
}

/** Glass Bubble Style for active icons (Bottom Nav, TopBar hover) */
export function getGlassBubbleStyle(isLight: boolean, active: boolean = false): CSSProperties {
  if (!active) {
    return {
      background: isLight ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
      boxShadow: isLight
        ? 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.02)'
        : 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.1)',
      border: isLight ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '9999px',
    };
  }
  
  return {
    background: isLight ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
    boxShadow: isLight
      ? 'inset 0 1px 4px rgba(255,255,255,0.8), inset 0 -2px 6px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)'
      : 'inset 0 1px 4px rgba(255,255,255,0.2), inset 0 -2px 6px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)',
    border: isLight ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '9999px',
  };
}

export function isDashboardPath(pathname: string) {
  return /\/(client|owner|admin)\/dashboard\/?/.test(pathname);
}