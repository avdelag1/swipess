import type { CSSProperties } from 'react';
import { Capacitor } from '@capacitor/core';

export const HEADER_CHROME_PILL_CLASS = 'header-chrome-pill';

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Liquid glass on native Capacitor; solid neo-naïve on web. */
function glassSurface(isLight: boolean, strong = false): Pick<CSSProperties, 'background' | 'backdropFilter' | 'WebkitBackdropFilter'> {
  if (!isNative()) {
    return {
      background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(16, 16, 22, 0.96)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    };
  }
  return {
    background: isLight
      ? (strong ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.55)')
      : (strong ? 'rgba(16, 16, 22, 0.48)' : 'rgba(16, 16, 22, 0.52)'),
    backdropFilter: strong ? 'blur(28px) saturate(190%)' : 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: strong ? 'blur(28px) saturate(190%)' : 'blur(20px) saturate(180%)',
  };
}

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
 * Header pills — neo-naïve both themes.
 * Light: black ink. Dark: bright white ink frames.
 */
export function getTopBarChrome(isLight: boolean, _isDashboard = false) {
  const useLightIcons = !isLight;

  const pillStyle: CSSProperties = isLight
    ? {
        ...glassSurface(true),
        border: '2px solid #141414',
        boxShadow: '1.25px 1.25px 0 #141414, 0 4px 12px rgba(20, 20, 20, 0.06)',
        borderRadius: '9999px',
        pointerEvents: 'auto',
        color: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.12s ease-out',
        overflow: 'visible',
      }
    : {
        ...glassSurface(false),
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow:
          '1.25px 1.25px 0 rgba(255,255,255,0.35), 0 0 16px rgba(255,255,255,0.14), 0 6px 18px rgba(0,0,0,0.35)',
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
    inactiveIconColor: useLightIcons ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.55)',
    pillStyle,
    iconShadow: 'none',
  };
}

/**
 * Bottom dock — neo-naïve both themes.
 * Light: black ink pill. Dark: bright white ink pill.
 */
export function getBottomNavChrome(isLight: boolean, _isDashboard = false) {
  const useLightIcons = !isLight;

  const dockStyle: CSSProperties = isLight
    ? {
        ...glassSurface(true, true),
        border: '2.25px solid #141414',
        boxShadow: '1.5px 1.5px 0 #141414, 0 8px 24px rgba(20, 20, 20, 0.08)',
        borderRadius: '9999px',
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
        ...glassSurface(false, true),
        border: '2.25px solid rgba(255, 255, 255, 0.9)',
        boxShadow:
          '1.5px 1.5px 0 rgba(255,255,255,0.35), 0 0 22px rgba(255,255,255,0.14), 0 10px 28px rgba(0,0,0,0.4)',
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
    inactiveIconColor: useLightIcons ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.55)',
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
