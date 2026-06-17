import type { CSSProperties } from 'react';

/** Shared TopBar / nav pill + icon colors — dashboard swipe deck always uses light icons. */
export function getHeaderChrome(isLight: boolean, isDashboard = false) {
  const useLightIcons = isDashboard || !isLight;

  const pillStyle: CSSProperties = {
    background: isLight
      ? (isDashboard ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.10)')
      : 'transparent',
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
      ? 'rgba(255,255,255,0.65)'
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