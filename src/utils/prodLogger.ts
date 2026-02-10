/**
 * Production-safe logger utility
 *
 * Automatically disables debug/info logs in production while keeping errors visible.
 * Reduces bundle size and improves performance by eliminating unnecessary console calls.
 *
 * Usage:
 *   import { logger } from '@/utils/prodLogger';
 *
 *   logger.log('[Component] Debug message');     // Only in development
 *   logger.warn('[Component] Warning message');  // Only in development
 *   logger.error('[Component] Error message');   // Always logged
 *   logger.info('[Component] Info message');     // Only in development
 */

const isDev = import.meta.env.DEV;

/**
 * Logger utility that respects environment
 * - In development: All logs are displayed
 * - In production: Only errors are displayed
 */
export const logger = {
  /**
   * General debug logging (development only)
   */
  log: isDev ? console.log : () => {},

  /**
   * Warning messages (development only)
   */
  warn: isDev ? console.warn : () => {},

  /**
   * Error messages (always logged, even in production)
   */
  error: console.error,

  /**
   * Debug messages (development only)
   */
  debug: isDev ? console.debug : () => {},

  /**
   * Info messages (development only)
   */
  info: isDev ? console.info : () => {},

  /**
   * Grouped logs (development only)
   */
  group: isDev ? console.group : () => {},

  /**
   * End grouped logs (development only)
   */
  groupEnd: isDev ? console.groupEnd : () => {},

  /**
   * Table display (development only)
   */
  table: isDev ? console.table : () => {},

  /**
   * Time tracking start (development only)
   */
  time: isDev ? console.time : () => {},

  /**
   * Time tracking end (development only)
   */
  timeEnd: isDev ? console.timeEnd : () => {},

  /**
   * Trace logs (development only)
   */
  trace: isDev ? console.trace : () => {},
};

/**
 * Create a context-specific logger
 *
 * @param context - The context/component name for prefixing logs
 * @returns Logger with auto-prefixed messages
 *
 * @example
 * const log = createLogger('MessagingInterface');
 * log.info('User connected'); // [MessagingInterface] User connected
 */
export function createLogger(context: string) {
  return {
    log: (message: string, ...args: any[]) => logger.log(`[${context}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => logger.warn(`[${context}] ${message}`, ...args),
    error: (message: string, ...args: any[]) => logger.error(`[${context}] ${message}`, ...args),
    debug: (message: string, ...args: any[]) => logger.debug(`[${context}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => logger.info(`[${context}] ${message}`, ...args),
  };
}

/**
 * Performance monitoring utility
 * Only active in development
 */
export const perfMonitor = {
  /**
   * Mark a performance point
   */
  mark: (name: string) => {
    if (isDev && performance && performance.mark) {
      performance.mark(name);
    }
  },

  /**
   * Measure between two marks
   */
  measure: (name: string, startMark: string, endMark?: string) => {
    if (isDev && performance && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        logger.info(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        // Silently fail if marks don't exist
      }
    }
  },

  /**
   * Clear all marks and measures
   */
  clear: () => {
    if (isDev && performance) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },
};

export default logger;
