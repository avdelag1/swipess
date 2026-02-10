import { useState, useEffect, createContext, useContext, useMemo, ReactNode } from 'react';

/**
 * PWA Mode Detection and Optimization Hook
 *
 * Detects when the app is running as an installed PWA (standalone mode)
 * and provides optimized animation/rendering settings for the constrained
 * PWA runtime environment.
 *
 * Why PWA needs different treatment:
 * - Different rendering pipeline than browser
 * - More memory limits
 * - Less aggressive GPU acceleration
 * - Different gesture handling layer
 * - Throttled touchmove events
 * - Worse requestAnimationFrame timing
 */

export interface PWAOptimizations {
  // Animation settings
  springStiffness: number;
  springDamping: number;
  springMass: number;
  transitionDuration: number;

  // Effect settings
  enableShadows: boolean;
  enableBlur: boolean;
  enableGlow: boolean;
  enableOverlayEffects: boolean;

  // Image settings
  preloadCount: number;
  imageQuality: number;

  // General
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

const BROWSER_OPTIMIZATIONS: PWAOptimizations = {
  springStiffness: 500,
  springDamping: 35,
  springMass: 0.5,
  transitionDuration: 0.35,
  enableShadows: true,
  enableBlur: true,
  enableGlow: true,
  enableOverlayEffects: true,
  preloadCount: 3,
  imageQuality: 85,
  isPWA: false,
  isIOS: false,
  isAndroid: false,
};

// PWA mode: Lighter animations, disabled expensive effects
const PWA_OPTIMIZATIONS: PWAOptimizations = {
  springStiffness: 600, // Stiffer = faster snap, less frames needed
  springDamping: 40,    // Higher damping = less oscillation
  springMass: 0.3,      // Lighter mass = more responsive
  transitionDuration: 0.2, // Shorter transitions
  enableShadows: false,   // Shadows are expensive in PWA
  enableBlur: false,      // Blur kills PWA performance
  enableGlow: false,      // Animated glows are heavy
  enableOverlayEffects: false, // Disable ping animations etc
  preloadCount: 5,        // Preload more images upfront
  imageQuality: 75,       // Lower quality for faster decode
  isPWA: true,
  isIOS: false,
  isAndroid: false,
};

// iOS PWA is the worst - even more aggressive
const IOS_PWA_OPTIMIZATIONS: PWAOptimizations = {
  ...PWA_OPTIMIZATIONS,
  springStiffness: 700,
  springDamping: 45,
  springMass: 0.25,
  transitionDuration: 0.15,
  preloadCount: 6,
  imageQuality: 70,
  isIOS: true,
};

function detectPWAMode(): { isPWA: boolean; isIOS: boolean; isAndroid: boolean } {
  if (typeof window === 'undefined') {
    return { isPWA: false, isIOS: false, isAndroid: false };
  }

  // Check display-mode media query
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // iOS specific check - navigator.standalone is iOS Safari only
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Detect platform
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);

  // Also check if launched from home screen (some Android browsers)
  const isLaunchedFromHomeScreen = document.referrer.includes('android-app://') ||
    window.matchMedia('(display-mode: minimal-ui)').matches;

  const isPWA = isStandalone || isIOSStandalone || isLaunchedFromHomeScreen;

  return { isPWA, isIOS, isAndroid };
}

function getOptimizations(isPWA: boolean, isIOS: boolean, isAndroid: boolean): PWAOptimizations {
  if (!isPWA) {
    return { ...BROWSER_OPTIMIZATIONS, isIOS, isAndroid };
  }

  if (isIOS) {
    return { ...IOS_PWA_OPTIMIZATIONS, isAndroid };
  }

  return { ...PWA_OPTIMIZATIONS, isIOS, isAndroid };
}

// Context for app-wide PWA optimizations
const PWAContext = createContext<PWAOptimizations>(BROWSER_OPTIMIZATIONS);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState(() => detectPWAMode());

  useEffect(() => {
    // Re-detect on display-mode change (rare but possible)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const handleChange = () => {
      setMode(detectPWAMode());
    };

    // Use addEventListener with options for proper cleanup
    mediaQuery.addEventListener('change', handleChange);

    // Also add a class to document for CSS-based optimizations
    const { isPWA, isIOS } = detectPWAMode();
    if (isPWA) {
      document.documentElement.classList.add('pwa-mode');
      if (isIOS) {
        document.documentElement.classList.add('pwa-ios');
      }
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const optimizations = useMemo(
    () => getOptimizations(mode.isPWA, mode.isIOS, mode.isAndroid),
    [mode.isPWA, mode.isIOS, mode.isAndroid]
  );

  return (
    <PWAContext.Provider value={optimizations}>
      {children}
    </PWAContext.Provider>
  );
}

// Hook for components to get PWA optimizations
export function usePWAMode(): PWAOptimizations {
  return useContext(PWAContext);
}

// Standalone detection function for use outside React
export function isPWAMode(): boolean {
  return detectPWAMode().isPWA;
}

// Export constants for direct use
export { BROWSER_OPTIMIZATIONS, PWA_OPTIMIZATIONS, IOS_PWA_OPTIMIZATIONS };
