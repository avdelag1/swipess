/**
 * Logger utility for conditional logging based on environment
 * Replaces direct console.log calls throughout the application
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('Debug message');
 *   logger.warn('Warning message');
 *   logger.error('Error message');
 */

const isDevelopment = import.meta.env.DEV;

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
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  /**
   * Log informational messages (only in development)
   */
  info(...args: unknown[]): void {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  }

  /**
   * Log debug messages with context (only in development)
   */
  debug(message: string, data?: unknown, options?: LoggerOptions): void {
    if (isDevelopment) {
      const formatted = options?.timestamp
        ? this.formatMessage('debug', message, options.context)
        : message;

      if (data) {
        // eslint-disable-next-line no-console
        console.debug(formatted, data);
      } else {
        // eslint-disable-next-line no-console
        console.debug(formatted);
      }
    }
  }

  /**
   * Log warning messages (only in development)
   * Warnings should be reviewed but don't break functionality
   */
  warn(...args: unknown[]): void {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  }

  /**
   * Log error messages (always logged, even in production)
   * Errors indicate something went wrong and should be tracked
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * Create a scoped logger with a fixed context
   * Useful for component or module-specific logging
   *
   * Example:
   *   const authLogger = logger.scope('Auth');
   *   authLogger.log('User logged in'); // Outputs: [Auth] User logged in
   */
  scope(context: string) {
    return {
      log: (...args: any[]) => this.log(`[${context}]`, ...args),
      info: (...args: any[]) => this.info(`[${context}]`, ...args),
      debug: (message: string, data?: any) => this.debug(message, data, { context }),
      warn: (...args: any[]) => this.warn(`[${context}]`, ...args),
      error: (...args: any[]) => this.error(`[${context}]`, ...args),
    };
  }

  /**
   * Utility to check if development mode is active
   */
  get isDevelopment(): boolean {
    return isDevelopment;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export typed scope function for easier usage
export function createLogger(context: string) {
  return logger.scope(context);
}
