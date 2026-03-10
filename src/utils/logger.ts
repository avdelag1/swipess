/**
 * Unified Logger utility for conditional logging based on environment
 * Replaces both logger.ts and prodLogger.ts
 *
 * Automatically disables non-error logs in production while keeping errors visible.
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LoggerOptions {
  context?: string;
  timestamp?: boolean;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `[${timestamp}] ${contextStr} ${message}`;
  }

  /**
   * Log general debug messages (only in development)
   */
  log(...args: unknown[]): void {
    if (isDev) {
      console.log(...args);
    }
  }

  /**
   * Log informational messages (only in development)
   */
  info(...args: unknown[]): void {
    if (isDev) {
      console.info(...args);
    }
  }

  /**
   * Log debug messages with context (only in development)
   */
  debug(message: string, data?: unknown, options?: LoggerOptions): void {
    if (isDev) {
      const formatted = options?.timestamp
        ? this.formatMessage('debug', message, options.context)
        : message;

      if (data) {
        console.debug(formatted, data);
      } else {
        console.debug(formatted);
      }
    }
  }

  /**
   * Log warning messages (only in development)
   */
  warn(...args: unknown[]): void {
    if (isDev) {
      console.warn(...args);
    }
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  // Compatibility methods for prodLogger.ts
  group = isDev ? console.group : () => { };
  groupEnd = isDev ? console.groupEnd : () => { };
  table = isDev ? console.table : () => { };
  time = isDev ? console.time : () => { };
  timeEnd = isDev ? console.timeEnd : () => { };
  trace = isDev ? console.trace : () => { };

  /**
   * Create a scoped logger with a fixed context
   */
  scope(context: string) {
    return {
      log: (message: string, ...args: any[]) => this.log(`[${context}] ${message}`, ...args),
      info: (message: string, ...args: any[]) => this.info(`[${context}] ${message}`, ...args),
      debug: (message: string, data?: any) => this.debug(message, data, { context }),
      warn: (message: string, ...args: any[]) => this.warn(`[${context}] ${message}`, ...args),
      error: (message: string, ...args: any[]) => this.error(`[${context}] ${message}`, ...args),
    };
  }

  get isDevelopment(): boolean {
    return isDev;
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a context-specific logger
 * @param context - The context/component name for prefixing logs
 */
export function createLogger(context: string) {
  return logger.scope(context);
}

/**
 * Performance monitoring utility
 * Only active in development
 */
export const perfMonitor = {
  mark: (name: string) => {
    if (isDev && typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (isDev && typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          logger.info(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
        }
      } catch (error) {
        // Silently fail if marks don't exist
      }
    }
  },

  clear: () => {
    if (isDev && typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },
};

export default logger;
