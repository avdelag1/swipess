import { useState, useEffect, useCallback, useMemo } from 'react';

// Breakpoint definitions matching Tailwind CSS defaults
export const BREAKPOINTS = {
  xs: 0,      // Extra small (phones)
  sm: 640,    // Small (large phones, small tablets)
  md: 768,    // Medium (tablets)
  lg: 1024,   // Large (laptops)
  xl: 1280,   // Extra large (desktops)
  '2xl': 1536, // 2X large (large desktops)
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  // Current dimensions
  width: number;
  height: number;

  // Breakpoint flags - true if width >= breakpoint
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;

  // Convenience flags
  isMobile: boolean;      // < md (768px)
  isTablet: boolean;      // >= md && < lg
  isDesktop: boolean;     // >= lg (1024px)
  isLargeScreen: boolean; // >= xl (1280px)

  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;

  // Device type detection
  isTouchDevice: boolean;

  // Current breakpoint name
  breakpoint: BreakpointKey;

  // Helper functions
  up: (breakpoint: BreakpointKey) => boolean;
  down: (breakpoint: BreakpointKey) => boolean;
  between: (min: BreakpointKey, max: BreakpointKey) => boolean;
  only: (breakpoint: BreakpointKey) => boolean;
}

// Detect if device supports touch
const detectTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Get current breakpoint name based on width
const getBreakpoint = (width: number): BreakpointKey => {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Get the next breakpoint value for "down" and "only" calculations
const getNextBreakpointValue = (breakpoint: BreakpointKey): number => {
  const keys = Object.keys(BREAKPOINTS) as BreakpointKey[];
  const index = keys.indexOf(breakpoint);
  if (index === keys.length - 1) return Infinity;
  return BREAKPOINTS[keys[index + 1]];
};

export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  const [isTouchDevice] = useState(detectTouchDevice);

  // Debounced resize handler for performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Clear any pending updates
      clearTimeout(timeoutId);

      // Debounce resize events (100ms delay)
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    // Also handle orientation change
    const handleOrientationChange = () => {
      // Small delay to let the browser settle after orientation change
      setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Also listen to visualViewport changes for mobile keyboards
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Memoized helper functions
  const up = useCallback((breakpoint: BreakpointKey): boolean => {
    return dimensions.width >= BREAKPOINTS[breakpoint];
  }, [dimensions.width]);

  const down = useCallback((breakpoint: BreakpointKey): boolean => {
    return dimensions.width < BREAKPOINTS[breakpoint];
  }, [dimensions.width]);

  const between = useCallback((min: BreakpointKey, max: BreakpointKey): boolean => {
    return dimensions.width >= BREAKPOINTS[min] && dimensions.width < BREAKPOINTS[max];
  }, [dimensions.width]);

  const only = useCallback((breakpoint: BreakpointKey): boolean => {
    const minWidth = BREAKPOINTS[breakpoint];
    const maxWidth = getNextBreakpointValue(breakpoint);
    return dimensions.width >= minWidth && dimensions.width < maxWidth;
  }, [dimensions.width]);

  // Calculate all responsive values
  const responsiveState = useMemo((): ResponsiveState => {
    const { width, height } = dimensions;
    const breakpoint = getBreakpoint(width);

    return {
      // Dimensions
      width,
      height,

      // Breakpoint flags
      isXs: width >= BREAKPOINTS.xs,
      isSm: width >= BREAKPOINTS.sm,
      isMd: width >= BREAKPOINTS.md,
      isLg: width >= BREAKPOINTS.lg,
      isXl: width >= BREAKPOINTS.xl,
      is2Xl: width >= BREAKPOINTS['2xl'],

      // Convenience flags
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      isLargeScreen: width >= BREAKPOINTS.xl,

      // Orientation
      isPortrait: height > width,
      isLandscape: width >= height,

      // Touch detection
      isTouchDevice,

      // Current breakpoint
      breakpoint,

      // Helper functions
      up,
      down,
      between,
      only,
    };
  }, [dimensions, isTouchDevice, up, down, between, only]);

  return responsiveState;
}

// Export a simpler hook for just getting the breakpoint
export function useBreakpoint(): BreakpointKey {
  const { breakpoint } = useResponsive();
  return breakpoint;
}

// Export a hook for checking if above a certain breakpoint
export function useMediaQuery(breakpoint: BreakpointKey): boolean {
  const { up } = useResponsive();
  return up(breakpoint);
}
