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
  const useLightIcons = !isLight;

  const pillStyle: CSSProperties = {
    background: isLight
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(255, 255, 255, 0.08)',
    border: isLight
      ? '0.5px solid rgba(255, 255, 255, 0.6)'
      : '0.5px solid rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
    boxShadow: isLight
      ? '0 2px 12px rgba(0, 0, 0, 0.06), inset 0 0.5px 0 rgba(255, 255, 255, 0.8)'
      : '0 2px 16px rgba(0, 0, 0, 0.25), inset 0 0.5px 0 rgba(255, 255, 255, 0.15)',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: 'hsl(var(--foreground))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.12s ease-out',
    overflow: 'visible',
    transform: 'translateZ(0)',
    willChange: 'transform',
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

export function isDashboardPath(pathname: string) {
  return /\/(client|owner|admin)\/dashboard\/?/.test(pathname);
}