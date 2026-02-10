/**
 * FIRE-AND-FORGET SWIPE QUEUE
 *
 * Zero-blocking background processor for swipe database operations.
 * Swipe animations NEVER wait for this - it runs completely detached.
 *
 * Architecture:
 * - All swipes go to the unified `likes` table
 * - Uses direction column ('like' or 'dismiss')
 * - Uses target_type column ('listing' or 'profile')
 * - Unique constraint: (user_id, target_id, target_type)
 */

import { supabase } from '@/integrations/supabase/client';

interface QueuedSwipe {
  id: string;
  targetId: string;
  direction: 'left' | 'right';
  targetType: 'listing' | 'profile';
  timestamp: number;
  retries: number;
  userId?: string;
}

interface SwipeQueueConfig {
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  processIntervalMs: number;
}

const DEFAULT_CONFIG: SwipeQueueConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  batchSize: 5,
  processIntervalMs: 100,
};

class SwipeQueueProcessor {
  private queue: QueuedSwipe[] = [];
  private processing = false;
  private config: SwipeQueueConfig;
  private cachedUserId: string | null = null;
  private userIdPromise: Promise<string | null> | null = null;
  private idleCallbackId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<SwipeQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadPersistedQueue();
    this.prefetchUserId();
  }

  /**
   * INSTANT: Queue a swipe for background processing
   * Returns immediately - never blocks UI
   */
  queueSwipe(
    targetId: string,
    direction: 'left' | 'right',
    targetType: 'listing' | 'profile' = 'listing'
  ): void {
    const swipe: QueuedSwipe = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      targetId,
      direction,
      targetType,
      timestamp: Date.now(),
      retries: 0,
      userId: this.cachedUserId || undefined,
    };

    this.queue.push(swipe);
    this.persistQueue();
    this.scheduleProcessing();
  }

  /**
   * Pre-fetch user ID at app boot - never fetch during swipe
   */
  async prefetchUserId(): Promise<void> {
    if (this.cachedUserId) return;
    if (this.userIdPromise) return;

    this.userIdPromise = (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        this.cachedUserId = user?.id || null;
        return this.cachedUserId;
      } catch {
        return null;
      }
    })();

    await this.userIdPromise;
    this.userIdPromise = null;
  }

  /**
   * Get cached user ID - NEVER makes network call
   */
  getCachedUserId(): string | null {
    return this.cachedUserId;
  }

  /**
   * Set user ID from external source (e.g., auth context)
   */
  setUserId(userId: string): void {
    this.cachedUserId = userId;
  }

  /**
   * Schedule background processing using requestIdleCallback
   * Falls back to setTimeout for browsers without support
   */
  private scheduleProcessing(): void {
    if (this.processing) return;
    if (this.idleCallbackId !== null || this.timeoutId !== null) return;

    if ('requestIdleCallback' in window) {
      this.idleCallbackId = requestIdleCallback(
        () => {
          this.idleCallbackId = null;
          this.processQueue();
        },
        { timeout: 500 }
      );
    } else {
      // Fallback: Use setTimeout with 0 delay to yield to UI
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        this.processQueue();
      }, 0);
    }
  }

  /**
   * Process queued swipes in background
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      // Ensure we have user ID
      if (!this.cachedUserId) {
        await this.prefetchUserId();
        if (!this.cachedUserId) {
          // No user - keep items queued for later
          this.processing = false;
          return;
        }
      }

      // Process batch
      const batch = this.queue.splice(0, this.config.batchSize);
      const results = await Promise.allSettled(
        batch.map(swipe => this.processSwipe(swipe))
      );

      // Re-queue failed swipes
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const swipe = batch[index];
          if (swipe.retries < this.config.maxRetries) {
            swipe.retries++;
            this.queue.push(swipe);
          }
          // If max retries exceeded, swipe is dropped (user can re-swipe)
        }
      });

      this.persistQueue();

      // Schedule next batch if more items
      if (this.queue.length > 0) {
        this.scheduleProcessing();
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single swipe - writes to Supabase
   * Uses unified likes table with direction column
   * Maps 'left'/'right' to 'dismiss'/'like' for database
   */
  private async processSwipe(swipe: QueuedSwipe): Promise<void> {
    const userId = swipe.userId || this.cachedUserId;
    if (!userId) throw new Error('No user ID');

    // Pass direction directly to database: 'left' or 'right'
    // DB constraint requires direction IN ('left', 'right')
    const dbDirection = swipe.direction;

    // Upsert to likes table with direction
    // Unique constraint is on (user_id, target_id, target_type)
    const { error } = await supabase
      .from('likes')
      .upsert({
        user_id: userId,
        target_id: swipe.targetId,
        target_type: swipe.targetType,
        direction: dbDirection
      }, {
        onConflict: 'user_id,target_id,target_type',
        ignoreDuplicates: false,
      });

    if (error) throw error;

    // Fire-and-forget: notification and match detection
    // These don't need to complete - run them without awaiting
    if (swipe.direction === 'right') {
      this.sendNotificationAsync(userId, swipe);
      this.checkMatchAsync(userId, swipe);
    }
  }

  /**
   * Send notification in background - completely fire-and-forget
   */
  private sendNotificationAsync(userId: string, swipe: QueuedSwipe): void {
    queueMicrotask(async () => {
      try {
        let recipientId: string | null = null;

        if (swipe.targetType === 'listing') {
          const { data: listing } = await supabase
            .from('listings')
            .select('owner_id')
            .eq('id', swipe.targetId)
            .maybeSingle();
          recipientId = listing?.owner_id || null;
        } else {
          recipientId = swipe.targetId;
        }

        if (recipientId) {
          await supabase.from('notifications').insert([{
            user_id: recipientId,
            notification_type: 'new_like',
            title: '💚 Someone liked you!',
            message: 'You have a new like. Swipe to see if it\'s a match!',
            is_read: false,
            metadata: { liker_id: userId, target_id: swipe.targetId, target_type: swipe.targetType },
          }]);
        }
      } catch {
        // Silent fail - notifications are non-critical
      }
    });
  }

  /**
   * Check for match in background - completely fire-and-forget
   * Uses unified likes table to check for mutual likes
   */
  private checkMatchAsync(userId: string, swipe: QueuedSwipe): void {
    queueMicrotask(async () => {
      try {
        if (swipe.targetType === 'listing') {
          // Get listing owner
          const { data: listing } = await supabase
            .from('listings')
            .select('owner_id')
            .eq('id', swipe.targetId)
            .maybeSingle();

          if (!listing) return;

          // Check if owner liked this client (check likes table for profile like)
          // Database uses 'right' for likes, 'left' for dismissals
          const { data: ownerLike } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', listing.owner_id)
            .eq('target_id', userId)
            .eq('target_type', 'profile')
            .eq('direction', 'right')
            .maybeSingle();

          if (ownerLike) {
            // Create match using client_id and owner_id (actual schema)
            await supabase.from('matches').upsert({
              client_id: userId,
              owner_id: listing.owner_id,
              listing_id: swipe.targetId,
              status: 'active',
            }, {
              onConflict: 'client_id,owner_id,listing_id',
              ignoreDuplicates: true,
            });

            // Create conversation
            await supabase.from('conversations').upsert({
              client_id: userId,
              owner_id: listing.owner_id,
              listing_id: swipe.targetId,
              status: 'active',
              free_messaging: true,
            }, {
              onConflict: 'client_id,owner_id',
              ignoreDuplicates: true,
            });
          }
        }
      } catch {
        // Silent fail - match detection is non-critical
        // Matches can be detected on next app load
      }
    });
  }

  /**
   * Persist queue to localStorage for offline support
   */
  private persistQueue(): void {
    try {
      if (this.queue.length > 0) {
        localStorage.setItem('swipe-queue', JSON.stringify(this.queue));
      } else {
        localStorage.removeItem('swipe-queue');
      }
    } catch {
      // localStorage might be full or disabled
    }
  }

  /**
   * Load persisted queue from localStorage
   */
  private loadPersistedQueue(): void {
    try {
      const stored = localStorage.getItem('swipe-queue');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
          this.scheduleProcessing();
        }
      }
    } catch {
      // Invalid data - ignore
    }
  }

  /**
   * Get queue length (for debugging/monitoring)
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear queue (for testing)
   */
  clearQueue(): void {
    this.queue = [];
    localStorage.removeItem('swipe-queue');
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId);
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }
}

// Singleton instance - shared across app
export const swipeQueue = new SwipeQueueProcessor();

// Hook for React components
export function useSwipeQueue() {
  return {
    queueSwipe: swipeQueue.queueSwipe.bind(swipeQueue),
    setUserId: swipeQueue.setUserId.bind(swipeQueue),
    prefetchUserId: swipeQueue.prefetchUserId.bind(swipeQueue),
    getQueueLength: swipeQueue.getQueueLength.bind(swipeQueue),
  };
}
