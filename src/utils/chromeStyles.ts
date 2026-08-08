import type { CSSProperties } from 'react';

export const HEADER_CHROME_PILL_CLASS = 'header-chrome-pill';

export const HEADER_PILL_BASE =
  `tap-css-only flex shrink-0 items-center justify-center rounded-full pointer-events-auto h-[32px] w-[32px] transition-all`;

export const HEADER_ICON = 'w-[16px] h-[16px]';

export type HeaderIconAccent = 'crown' | 'globe' | 'sparkles';

/** Depth shadow + optional accent glow for header HUD icons. */
export function getHeaderIconFilter(
  iconShadow: string,
  _useLightIcons: boolean,
  _accent?: HeaderIconAccent,
): string {
  return iconShadow;
}

/**
 * Liquid Glass header pills — theme adaptive.
 * Dark: white icons on dark translucent glass.
 * Light: black icons on light translucent glass.
 */
export function getTopBarChrome(isLight: boolean, _isDashboard = false) {
  const useLightIcons = !isLight;

  const pillStyle: CSSProperties = isLight
    ? {
        background: 'linear-gradient(145deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.48) 100%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderTop: '1px solid rgba(255, 255, 255, 0.95)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.7)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        borderRadius: '9999px',
        pointerEvents: 'auto',
        color: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.12s ease-out',
        overflow: 'visible',
      }
    : {
        background: 'linear-gradient(145deg, rgba(28,28,36,0.62) 0%, rgba(16,16,22,0.42) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderTop: '1px solid rgba(255, 255, 255, 0.24)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
        borderRadius: '9999px',
        pointerEvents: 'auto',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.12s ease-out',
        overflow: 'visible',
      };

  return {
    useLightIcons,
    iconColor: useLightIcons ? '#ffffff' : '#111111',
    inactiveIconColor: useLightIcons ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.42)',
    pillStyle,
    iconShadow: 'none',
  };
}

/**
 * Bottom dock — Liquid Glass floating layer, theme adaptive.
 */
export function getBottomNavChrome(isLight: boolean, _isDashboard = false) {
  const useLightIcons = !isLight;

  const dockStyle: CSSProperties = isLight
    ? {
        background: 'linear-gradient(165deg, rgba(255,255,255,0.82) 0%, rgba(246,246,250,0.72) 100%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderTop: '1px solid rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(36px) saturate(180%)',
        WebkitBackdropFilter: 'blur(36px) saturate(180%)',
        boxShadow: '0 10px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        borderRadius: '9999px',
        pointerEvents: 'auto',
        color: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease',
        overflow: 'visible',
        isolation: 'isolate',
      }
    : {
        background: 'linear-gradient(165deg, rgba(26,26,32,0.88) 0%, rgba(14,14,18,0.82) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderTop: '1px solid rgba(255, 255, 255, 0.22)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(36px) saturate(170%)',
        WebkitBackdropFilter: 'blur(36px) saturate(170%)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
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

  return {
    useLightIcons,
    iconColor: useLightIcons ? '#FFFFFF' : '#111111',
    inactiveIconColor: useLightIcons ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.42)',
    pillStyle: dockStyle,
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
