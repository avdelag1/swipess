/**
 * Centralized Realtime Subscription Manager
 *
 * Problem solved: Multiple components subscribing to the same Supabase events
 * causes race conditions, duplicate state updates, and UI flickers.
 *
 * Solution: Single source of truth for all realtime subscriptions.
 * - Only ONE channel per event type
 * - Proper cleanup on unsubscribe
 * - Reference counting for multiple listeners
 * - Event bus pattern for notifying components
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '@/utils/prodLogger';

// Event types we support
export type RealtimeEventType =
  | 'conversation_messages:INSERT'
  | 'conversation_messages:UPDATE'
  | 'swipes:INSERT'
  | 'matches:UPDATE'
  | 'likes:INSERT'
  | 'notifications:INSERT';

// Listener callback type
export type RealtimeListener<T = any> = (payload: RealtimePostgresChangesPayload<T>) => void;

// Channel configuration
interface ChannelConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

// Internal tracking
interface SubscriptionEntry {
  channel: RealtimeChannel;
  listeners: Set<RealtimeListener>;
  config: ChannelConfig;
}

class RealtimeSubscriptionManager {
  private subscriptions: Map<string, SubscriptionEntry> = new Map();
  private initialized = false;
  private userId: string | null = null;

  /**
   * Initialize the manager with the current user ID
   * Must be called when user authenticates
   */
  initialize(userId: string): void {
    if (this.userId === userId && this.initialized) {
      return; // Already initialized for this user
    }

    // Cleanup existing subscriptions if user changed
    if (this.userId && this.userId !== userId) {
      this.cleanup();
    }

    this.userId = userId;
    this.initialized = true;

    if (import.meta.env.DEV) {
      logger.info('[RealtimeManager] Initialized for user:', userId);
    }
  }

  /**
   * Subscribe to a realtime event type
   * Returns an unsubscribe function
   */
  subscribe(eventType: RealtimeEventType, listener: RealtimeListener, customFilter?: string): () => void {
    if (!this.initialized || !this.userId) {
      if (import.meta.env.DEV) {
        logger.warn('[RealtimeManager] Attempted to subscribe before initialization');
      }
      return () => {}; // No-op unsubscribe
    }

    // Build unique key for this subscription (includes custom filter if provided)
    const subscriptionKey = customFilter ? `${eventType}:${customFilter}` : eventType;

    // Get or create subscription entry
    let entry = this.subscriptions.get(subscriptionKey);

    if (!entry) {
      // Create new channel
      const config = this.getChannelConfig(eventType, customFilter);
      const channelName = `global-${subscriptionKey.replace(/[^a-zA-Z0-9]/g, '-')}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event: config.event,
            schema: 'public',
            table: config.table,
            filter: config.filter,
          } as any,
          (payload: any) => {
            // Notify all listeners
            const currentEntry = this.subscriptions.get(subscriptionKey);
            if (currentEntry) {
              currentEntry.listeners.forEach(l => {
                try {
                  l(payload);
                } catch (error) {
                  if (import.meta.env.DEV) {
                    logger.error('[RealtimeManager] Listener error:', error);
                  }
                }
              });
            }
          }
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'SUBSCRIBED') {
            logger.info(`[RealtimeManager] Channel subscribed: ${channelName}`);
          }
        });

      entry = {
        channel,
        listeners: new Set(),
        config,
      };

      this.subscriptions.set(subscriptionKey, entry);
    }

    // Add listener
    entry.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      const currentEntry = this.subscriptions.get(subscriptionKey);
      if (!currentEntry) return;

      currentEntry.listeners.delete(listener);

      // If no more listeners, cleanup the channel
      if (currentEntry.listeners.size === 0) {
        currentEntry.channel.unsubscribe().then(() => {
          if (import.meta.env.DEV) {
            logger.info(`[RealtimeManager] Channel unsubscribed: ${subscriptionKey}`);
          }
        });
        this.subscriptions.delete(subscriptionKey);
      }
    };
  }

  /**
   * Get channel configuration for an event type
   */
  private getChannelConfig(eventType: RealtimeEventType, customFilter?: string): ChannelConfig {
    const [table, event] = eventType.split(':') as [string, 'INSERT' | 'UPDATE' | 'DELETE'];

    // Build default filter based on table and user
    let filter = customFilter;

    if (!filter && this.userId) {
      // Auto-filter by user involvement where applicable
      switch (table) {
        case 'swipes':
          filter = `target_id=eq.${this.userId}`;
          break;
        case 'matches':
          filter = `or(client_id.eq.${this.userId},owner_id.eq.${this.userId})`;
          break;
        // conversation_messages and likes don't have direct user filter
        // They filter in the listener based on conversation membership
      }
    }

    return { table, event, filter };
  }

  /**
   * Cleanup all subscriptions
   * Call when user logs out
   */
  cleanup(): void {
    this.subscriptions.forEach((entry, key) => {
      entry.channel.unsubscribe().then(() => {
        if (import.meta.env.DEV) {
          logger.info(`[RealtimeManager] Cleanup unsubscribed: ${key}`);
        }
      });
    });

    this.subscriptions.clear();
    this.userId = null;
    this.initialized = false;

    if (import.meta.env.DEV) {
      logger.info('[RealtimeManager] Cleanup complete');
    }
  }

  /**
   * Get current subscription count (for debugging)
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get listener count for a specific event type (for debugging)
   */
  getListenerCount(eventType: RealtimeEventType): number {
    const entry = this.subscriptions.get(eventType);
    return entry?.listeners.size ?? 0;
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const realtimeManager = new RealtimeSubscriptionManager();
