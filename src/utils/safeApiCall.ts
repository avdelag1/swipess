import { logger } from '@/utils/prodLogger';

/**
 * Safely call async functions with automatic error logging
 * @param name - Name for logging
 * @param fn - Async function to call
 * @param fallback - Optional fallback value if error occurs
 */
export async function safeApiCall<T>(
  name: string,
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[safeApiCall] ${name} failed:`, { 
      message,
      error,
      timestamp: new Date().toISOString()
    });
    
    if (fallback !== undefined) {
      logger.warn(`[safeApiCall] ${name} using fallback value`);
      return fallback;
    }
    
    return null;
  }
}

/**
 * Safely call Supabase database queries with error logging
 * @param query - Description of the query for logging
 * @param operation - The Supabase operation
 */
export async function safeDbQuery<T>(
  query: string,
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      logger.error(`[safeDbQuery] ${query} failed:`, { 
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error(`[safeDbQuery] ${query} crashed:`, { 
      error,
      timestamp: new Date().toISOString()
    });
    return null;
  }
}
