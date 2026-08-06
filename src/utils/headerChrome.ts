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
export function getHeaderChrome(isLight: boolean, _isDashboard = false) {
  // On the dashboard, the background can be bright (white cards, etc), so we use a dark glass frame and white icons for clarity.
  const useLightIcons = _isDashboard ? true : !isLight;

  const pillStyle: CSSProperties = {
    // Dark Liquid glass effect: deep translucent core, refractive subtle edges
    background: 'linear-gradient(145deg, rgba(15,15,20,0.7) 0%, rgba(15,15,20,0.4) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderTop: '1px solid rgba(255, 255, 255, 0.3)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(32px) saturate(180%) contrast(110%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%) contrast(110%)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.4)',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: 'hsl(var(--foreground))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.12s ease-out',
    overflow: 'visible',
  };

  const iconColor = useLightIcons ? '#FFFFFF' : '#111111';

  return {
    useLightIcons,
    iconColor,
    inactiveIconColor: useLightIcons
      ? 'rgba(255,255,255,0.7)'
      : 'rgba(0,0,0,0.45)',
    pillStyle,
    iconShadow: useLightIcons
      ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))'
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