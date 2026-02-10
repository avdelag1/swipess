/**
 * Performance monitoring and optimization utilities
 */

let isInitialized = false;

/**
 * Initialize performance optimizations
 * - Preconnect to common domains
 * - Set up resource hints
 */
export function initPerformanceOptimizations() {
  if (isInitialized || typeof document === 'undefined') {
    return;
  }
  isInitialized = true;

  // Preconnect to Supabase (if used)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    addPreconnect(supabaseUrl);
  }

  // Preconnect to common CDNs
  const commonDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  commonDomains.forEach(addPreconnect);

  // Mark long tasks if supported
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (import.meta.env.DEV) {
            console.warn('[Performance] Long task detected:', entry.duration, 'ms');
          }
        });
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {
      // Browser doesn't support long task observer
    }
  }
}

/**
 * Add a preconnect link to the document head
 */
function addPreconnect(url: string) {
  if (typeof document === 'undefined') return;

  // Check if preconnect already exists
  const existing = document.querySelector(`link[rel="preconnect"][href="${url}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Measure a function's execution time
 */
export function measureExecutionTime<T>(
  name: string,
  fn: () => T
): T {
  if (import.meta.env.DEV) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
}

/**
 * Debounce performance-intensive operations
 */
export function debounceAnimation<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, wait);
  }) as T;
}
