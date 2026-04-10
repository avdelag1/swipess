/**
 * Offline Swipe Queue - Queues swipes when offline and syncs when back online
 *
 * ARCHITECTURE:
 * - All swipes go to the unified `likes` table with direction column
 * - direction='like' for likes (UI uses 'right')
 * - direction='dismiss' for dislikes (UI uses 'left')
 * - target_type='listing' or 'profile'
 * - Unique constraint: (user_id, target_id, target_type)
 *
 * PERFORMANCE BENEFIT:
 * - Users can continue swiping even when offline
 * - Swipes are queued in localStorage and synced when connection returns
 * - No lost swipes, no retry fatigue for users
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export interface QueuedSwipe {
  id: string;
  targetId: string;
  direction: 'left' | 'right';
  targetType: 'listing' | 'profile';
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'offline-swipe-queue';
const MAX_RETRIES = 3;

/**
 * Get all queued swipes from localStorage
 */
export function getQueuedSwipes(): QueuedSwipe[] {
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

/**
 * Add a swipe to the offline queue
 */
export function queueSwipe(swipe: Omit<QueuedSwipe, 'id' | 'timestamp' | 'retryCount'>): void {
  try {
    const queue = getQueuedSwipes();

    // Don't queue duplicates
    const exists = queue.some(
      q => q.targetId === swipe.targetId && q.direction === swipe.direction
    );
    if (exists) return;

    queue.push({
      ...swipe,
      id: `${swipe.targetId}-${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0,
    });

    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    logger.info('[OfflineQueue] Swipe queued for sync:', swipe.targetId);
  } catch (error) {
    logger.error('[OfflineQueue] Failed to queue swipe:', error);
  }
}

/**
 * Remove a swipe from the queue after successful sync
 */
function removeFromQueue(id: string): void {
  try {
    const queue = getQueuedSwipes();
    const filtered = queue.filter(q => q.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Mark a swipe as failed (increment retry count or remove if max retries)
 */
function markSwipeFailed(id: string): void {
  try {
    const queue = getQueuedSwipes();
    const updated = queue
      .map(q => {
        if (q.id === id) {
          return { ...q, retryCount: q.retryCount + 1 };
        }
        return q;
      })
      .filter(q => q.retryCount < MAX_RETRIES); // Remove if too many retries

    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

/**
 * Sync a single queued swipe to the server
 * Uses the unified likes table with direction column
 * Maps 'left'/'right' to 'dismiss'/'like' for database
 */
async function syncSwipe(swipe: QueuedSwipe): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      logger.warn('[OfflineQueue] No user for sync');
      return false;
    }

    // Pass direction directly to database: 'left' or 'right'
    // DB constraint requires direction IN ('left', 'right')
    const dbDirection = swipe.direction;

    // All swipes go to the unified likes table
    // Unique constraint is on (user_id, target_id, target_type)
    const { error } = await supabase
      .from('likes')
      .upsert({
        user_id: user.id,
        target_id: swipe.targetId,
        target_type: swipe.targetType,
        direction: dbDirection
      }, {
        onConflict: 'user_id,target_id,target_type',
        ignoreDuplicates: false,
      });

    if (error) {
      logger.error('[OfflineQueue] Sync failed:', swipe.targetId, error);
      return false;
    }

    logger.info('[OfflineQueue] Synced swipe:', swipe.targetId, swipe.direction);
    return true;
  } catch (error) {
    logger.error('[OfflineQueue] Sync error:', error);
    return false;
  }
}

/**
 * Sync all queued swipes to the server
 * Called when coming back online
 */
export async function syncQueuedSwipes(): Promise<{ synced: number; failed: number }> {
  const queue = getQueuedSwipes();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  logger.info('[OfflineQueue] Syncing', queue.length, 'queued swipes');

  let synced = 0;
  let failed = 0;

  // Process sequentially to avoid rate limits
  for (const swipe of queue) {
    const success = await syncSwipe(swipe);

    if (success) {
      removeFromQueue(swipe.id);
      synced++;
    } else {
      markSwipeFailed(swipe.id);
      failed++;
    }

    // Small delay between syncs to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (synced > 0) {
    logger.info('[OfflineQueue] Sync complete:', synced, 'synced,', failed, 'failed');
  }

  return { synced, failed };
}

/**
 * Check if we're offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Get queue size for UI display
 */
export function getQueueSize(): number {
  return getQueuedSwipes().length;
}

/**
 * Initialize offline sync listeners
 * Call this once at app startup
 */
export function initOfflineSync(): () => void {
  // Sync when coming back online
  const handleOnline = () => {
    logger.info('[OfflineQueue] Back online, syncing...');
    // Use requestIdleCallback to not block main thread
    if ('requestIdleCallback' in window) {
      (window as Window).requestIdleCallback(() => {
        syncQueuedSwipes();
      }, { timeout: 5000 });
    } else {
      setTimeout(() => syncQueuedSwipes(), 1000);
    }
  };

  window.addEventListener('online', handleOnline);

  // Also try to sync on visibility change (user returns to tab)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      const queue = getQueuedSwipes();
      if (queue.length > 0) {
        syncQueuedSwipes();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);

  // Initial sync check on startup (in case we were offline before)
  if (navigator.onLine) {
    setTimeout(() => syncQueuedSwipes(), 2000);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
