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
  // The header buttons should always match the bottom nav bar.
  // In light theme, they use a crisp white pill with dark icons.
  // In dark theme, they use a dark pill with white icons.
  const useLightIcons = !isLight;

  const pillStyle: CSSProperties = {
    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,30,0.65)',
    border: isLight ? '1px solid rgba(0,0,0,0.06)' : 'none',
    boxShadow: isLight
      ? '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'
      : '0 2px 12px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(16px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: 'hsl(var(--foreground))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
    overflow: 'visible',
  };

  const iconColor = useLightIcons ? '#FFFFFF' : '#111111';

  return {
    useLightIcons,
    iconColor,
    inactiveIconColor: useLightIcons
      ? 'rgba(255,255,255,0.8)'
      : 'rgba(0,0,0,0.5)',
    pillStyle,
    iconShadow: useLightIcons
      ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))'
      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))',
  };
}

export function isDashboardPath(pathname: string) {
  return /\/(client|owner|admin)\/dashboard\/?/.test(pathname);
}