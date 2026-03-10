/**
 * Performance utility for bundle size logging
 */

export function logBundleSize() {
  if (import.meta.env.DEV) {
    // In development, we can log performance metrics
    console.log('[Performance] Bundle loaded');

    // Log performance timing if available
    if (typeof window !== 'undefined' && window.performance) {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (timing) {
        console.log('[Performance] DOM Content Loaded:', timing.domContentLoadedEventEnd - timing.startTime, 'ms');
        console.log('[Performance] Load Event:', timing.loadEventEnd - timing.startTime, 'ms');
      }
    }
  }
}
