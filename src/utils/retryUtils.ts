/**
 * Retry Utilities
 * 
 * Provides utilities for handling database race conditions and transient errors
 * with exponential backoff retry logic.
 */

export const PG_ERROR_CODES = {
  DUPLICATE_KEY: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505', // Same as DUPLICATE_KEY - different names for the same PostgreSQL error code
} as const;

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 300
): Promise<T> {
  let lastError: Error = new Error('No attempts made');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxAttempts) break;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError;
}
