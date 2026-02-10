/**
 * Web Vitals monitoring utility
 * Tracks Core Web Vitals metrics for performance monitoring
 */

type MetricCallback = (metric: {
  name: string;
  value: number;
  id: string;
}) => void;

let reportCallback: MetricCallback | null = null;

export function initWebVitalsMonitoring(callback?: MetricCallback) {
  if (callback) {
    reportCallback = callback;
  }

  // Only run in production and if the PerformanceObserver API is available
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && reportCallback) {
        reportCallback({
          name: 'LCP',
          value: lastEntry.startTime,
          id: 'lcp-' + Date.now(),
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Browser doesn't support LCP observer
  }

  // Track First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (reportCallback && 'processingStart' in entry) {
          reportCallback({
            name: 'FID',
            value: (entry as PerformanceEventTiming).processingStart - entry.startTime,
            id: 'fid-' + Date.now(),
          });
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // Browser doesn't support FID observer
  }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Report CLS when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && reportCallback) {
        reportCallback({
          name: 'CLS',
          value: clsValue,
          id: 'cls-' + Date.now(),
        });
      }
    });
  } catch {
    // Browser doesn't support layout shift observer
  }
}
