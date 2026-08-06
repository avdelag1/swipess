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
  if (!useLightIcons) return iconShadow;

  const accentGlow =
    accent === 'crown'
      ? 'drop-shadow(0 0 8px rgba(228,0,124,0.55))'
      : accent === 'globe'
        ? 'drop-shadow(0 0 8px rgba(59,130,246,0.55))'
        : accent === 'sparkles'
          ? 'drop-shadow(0 0 8px rgba(168,85,247,0.55))'
          : '';

  return accent ? `${iconShadow} ${accentGlow}` : iconShadow;
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
  // Use dark icons as requested by the user for header buttons
  const useLightIcons = false; 

  const pillStyle: CSSProperties = {
    background: _isDashboard 
      ? 'linear-gradient(145deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 100%)'
      : 'linear-gradient(145deg, rgba(15,15,20,0.7) 0%, rgba(15,15,20,0.4) 100%)',
    border: _isDashboard ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.15)',
    borderTop: _isDashboard ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
    borderBottom: _isDashboard ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(32px) saturate(180%) contrast(110%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%) contrast(110%)',
    boxShadow: _isDashboard 
      ? '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255,255,255,0.2)'
      : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.15)',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: '#ffffff',
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
      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
  };
}

export function getBottomNavChrome(isLight: boolean, _isDashboard = false) {
  // Always use light icons as requested by the user, and make the pill darker
  const useLightIcons = true;

  const pillStyle: CSSProperties = {
    background: _isDashboard 
      ? 'linear-gradient(145deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%)'
      : 'linear-gradient(145deg, rgba(15,15,20,0.85) 0%, rgba(15,15,20,0.6) 100%)',
    border: _isDashboard ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
    borderTop: _isDashboard ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)',
    borderBottom: _isDashboard ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(40px) saturate(180%) contrast(110%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%) contrast(110%)',
    boxShadow: _isDashboard
      ? '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255,255,255,0.2)'
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
      ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(255,255,255,0.2))' // Enhanced glow and shadow
      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
  };
}

/** Water Drop Style for individual icons (Bottom Nav, TopBar) */
export function getWaterDropStyle(isLight: boolean, active: boolean): CSSProperties {
  return {
    background: active
      ? (isLight 
          ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.15) 100%)'
          : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.02) 100%)')
      : (isLight
          ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)'
          : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.0) 100%)'),
    boxShadow: active
      ? (isLight
          ? 'inset 0 4px 8px rgba(255,255,255,0.9), inset 0 -4px 8px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.15)'
          : 'inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.5)')
      : (isLight
          ? 'inset 0 4px 8px rgba(255,255,255,0.9), inset 0 -4px 8px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)'
          : 'inset 0 4px 8px rgba(255,255,255,0.25), inset 0 -4px 8px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.3)'),
    border: isLight 
      ? '1px solid rgba(255,255,255,0.8)' 
      : '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(24px) saturate(250%) contrast(110%) brightness(1.2)',
    WebkitBackdropFilter: 'blur(24px) saturate(250%) contrast(110%) brightness(1.2)',
  };
}

export function isDashboardPath(pathname: string) {
  return /\/(client|owner|admin)\/dashboard\/?/.test(pathname);
}