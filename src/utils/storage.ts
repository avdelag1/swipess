/**
 * Centralized localStorage utility with error handling
 * Prevents silent failures and quota exceeded errors
 */
import { logger } from '@/utils/prodLogger';

/**
 * Safely get item from localStorage
 * Returns null if key doesn't exist or localStorage is unavailable
 */
export function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        logger.error(`localStorage quota exceeded when reading ${key}`);
      } else {
        logger.error(`Failed to read from localStorage (${key}):`, error.message);
      }
    }
    return null;
  }
}

/**
 * Safely parse JSON from localStorage
 * Returns default value if parsing fails or item doesn't exist
 */
export function getStorageJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error instanceof SyntaxError) {
        logger.error(`Invalid JSON in localStorage (${key}): ${error.message}`);
        // Clear corrupted data
        removeStorageItem(key);
      } else if (error.name === 'QuotaExceededError') {
        logger.error(`localStorage quota exceeded when reading ${key}`);
      } else {
        logger.error(`Failed to read JSON from localStorage (${key}):`, error.message);
      }
    }
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 * Returns true if successful, false otherwise
 */
export function setStorageItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        logger.error(`localStorage quota exceeded. Failed to save ${key}`);
        // Attempt to clear old data
        try {
          clearOldestStorageEntries(key);
          localStorage.setItem(key, value);
          return true;
        } catch {
          logger.error(`Failed to recover from quota exceeded for ${key}`);
          return false;
        }
      } else {
        logger.error(`Failed to write to localStorage (${key}):`, error.message);
      }
    }
    return false;
  }
}

/**
 * Safely set JSON in localStorage
 * Returns true if successful, false otherwise
 */
export function setStorageJSON<T>(key: string, value: T): boolean {
  try {
    const json = JSON.stringify(value);
    return setStorageItem(key, json);
  } catch (error) {
    logger.error(`Failed to stringify value for localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logger.error(`Failed to remove from localStorage (${key}):`, error);
  }
}

/**
 * Safely clear all localStorage
 */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    logger.error('Failed to clear localStorage:', error);
  }
}

/**
 * Get current localStorage usage as percentage
 */
export function getStorageUsagePercent(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage.getItem(key)?.length ?? 0;
      }
    }
    // Rough estimate: typical quota is 5-10MB
    const estimatedQuota = 5 * 1024 * 1024;
    return (total / estimatedQuota) * 100;
  } catch {
    return 0;
  }
}

/**
 * Clear oldest storage entries when quota is exceeded
 * Removes non-critical data starting with oldest
 */
function clearOldestStorageEntries(excludeKey?: string): void {
  const nonCriticalKeys = [
    'webVitals',
    'searchHistory',
    'temporaryData',
  ];

  for (const key of nonCriticalKeys) {
    if (key !== excludeKey) {
      removeStorageItem(key);
    }
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
