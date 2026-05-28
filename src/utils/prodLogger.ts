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

/* eslint-disable no-console */
const isDev = import.meta.env.DEV;

/**
 * Logger utility that respects environment
 * - In development: All logs are displayed
 * - In production: Only errors are displayed
 */
export const logger = {
  log: isDev ? console.warn : () => {},
  warn: isDev ? console.warn : () => {},

  error: console.error,

  debug: isDev ? console.debug : () => {},

  info: isDev ? console.warn : () => {},

  group: isDev ? console.group : () => {},

  groupEnd: isDev ? console.groupEnd : () => {},

  table: isDev ? console.table : () => {},

  time: isDev ? console.time : () => {},

  timeEnd: isDev ? console.timeEnd : () => {},

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
    log: (message: string, ...args: unknown[]) => logger.log(`[${context}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(`[${context}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => logger.error(`[${context}] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => logger.debug(`[${context}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(`[${context}] ${message}`, ...args),
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
      } catch (_error) {
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


