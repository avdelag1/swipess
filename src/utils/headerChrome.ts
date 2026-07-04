import type { CSSProperties } from 'react';

export const HEADER_CHROME_PILL_CLASS = 'header-chrome-pill';

/** Shared TopBar pill — dark contrast wells on light pages. */
export const HEADER_PILL_BASE =
  `tap-css-only flex shrink-0 items-center justify-center rounded-full glass-pill chrome-solid ${HEADER_CHROME_PILL_CLASS} pointer-events-auto h-[38px] w-[38px]`;

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

/** Shared TopBar / nav pill + icon colors — dashboard swipe deck always uses light icons. */
export function getHeaderChrome(isLight: boolean, isDashboard = false) {
  const useLightIcons = isDashboard || !isLight;

  const pillStyle: CSSProperties = {
    background: isLight
      ? (isDashboard ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.10)')
      : 'rgba(0,0,0,0.4)',
    border: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: 'hsl(var(--foreground))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
    overflow: 'visible',
  };

  return {
    useLightIcons,
    iconColor: useLightIcons ? '#FFFFFF' : '#0A0A0A',
    inactiveIconColor: useLightIcons
      ? 'rgba(255,255,255,0.8)'
      : (isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)'),
    pillStyle,
    iconShadow: useLightIcons
      ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))'
      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))',
  };
}

export function isDashboardPath(pathname: string) {
  return /\/(client|owner|admin)\/dashboard\/?/.test(pathname);
}