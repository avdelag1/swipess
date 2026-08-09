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
 * Light: Contemporary Neo-Naïve — black ink frames on paper white.
 */
export function getTopBarChrome(isLight: boolean, _isDashboard = false) {
  const useLightIcons = !isLight;

  const pillStyle: CSSProperties = isLight
    ? {
        background: 'rgba(255, 255, 255, 0.96)',
        border: '2px solid #141414',
        boxShadow: '1.25px 1.25px 0 #141414, 0 4px 12px rgba(20, 20, 20, 0.06)',
        borderRadius: '9999px',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        pointerEvents: 'auto',
        color: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.12s ease-out',
        overflow: 'visible',
      }
    : {
        background: 'linear-gradient(145deg, rgba(36,36,44,0.72) 0%, rgba(18,18,24,0.55) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderTop: '1px solid rgba(255, 255, 255, 0.26)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12)',
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
    iconColor: useLightIcons ? '#ffffff' : '#0a0a0a',
    inactiveIconColor: useLightIcons ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.45)',
    pillStyle,
    iconShadow: 'none',
  };
}

/**
 * Bottom dock — theme adaptive.
 * Light: neo-naïve ink pill. Dark: liquid glass.
 */
export function getBottomNavChrome(isLight: boolean, _isDashboard = false) {
  const useLightIcons = !isLight;

  const dockStyle: CSSProperties = isLight
    ? {
        background: 'rgba(255, 255, 255, 0.96)',
        border: '2.25px solid #141414',
        boxShadow: '1.5px 1.5px 0 #141414, 0 8px 24px rgba(20, 20, 20, 0.08)',
        borderRadius: '9999px',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        pointerEvents: 'auto',
        color: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease',
        overflow: 'visible',
        isolation: 'isolate',
      }
    : {
        background: 'linear-gradient(165deg, rgba(28,28,34,0.90) 0%, rgba(14,14,18,0.86) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderTop: '1px solid rgba(255, 255, 255, 0.22)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        boxShadow: '0 10px 32px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.10)',
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
    iconColor: useLightIcons ? '#FFFFFF' : '#0a0a0a',
    inactiveIconColor: useLightIcons ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.45)',
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
