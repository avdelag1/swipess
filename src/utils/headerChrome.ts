import type { CSSProperties } from 'react';

export const HEADER_CHROME_PILL_CLASS = 'header-chrome-pill';

export const HEADER_PILL_BASE =
  `tap-css-only flex shrink-0 items-center justify-center rounded-full glass-pill pointer-events-auto h-[36px] w-[36px] shadow-neumorph transition-all active:shadow-neumorph-inset`;

export const HEADER_ICON = 'w-[20px] h-[20px]';

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
export function getHeaderChrome(isLight: boolean, _isDashboard = false) {
  const useLightIcons = !isLight;

  const pillStyle: CSSProperties = {
    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,28,0.85)',
    border: isLight
      ? '1px solid rgba(0,0,0,0.02)'
      : '1px solid rgba(255,255,255,0.05)',
    backdropFilter: 'blur(48px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(48px) saturate(1.8)',
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