import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Prefetch Manager Hook
 * 
 * Implements React Query prefetchQuery() for:
 * - Next swipe batch when user reaches card index 2-3
 * - Next page for infinite lists when near end
 * - Likely conversation messages when entering messaging
 */
export function usePrefetchManager() {
  const queryClient = useQueryClient();
  const prefetchedKeys = useRef<Set<string>>(new Set());

  /**
   * Prefetch next batch of listings for swipe deck
   * Called when user reaches card index 2-3 of current batch
   */
  const prefetchNextSwipeBatch = useCallback(async (
    currentPage: number
  ) => {
    const key = `swipe-batch-${currentPage + 1}`;
    if (prefetchedKeys.current.has(key)) return;
    
    prefetchedKeys.current.add(key);

    await queryClient.prefetchQuery({
      queryKey: ['smart-listings', currentPage + 1],
      queryFn: async () => {
        const { data } = await (supabase as any)
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range((currentPage + 1) * 10, (currentPage + 2) * 10 - 1);
        return data || [];
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);

  /**
   * Prefetch conversation messages for likely-to-open threads
   * Called when user enters messaging dashboard
   */
  const prefetchTopConversationMessages = useCallback(async (
    conversationId: string
  ) => {
    const key = `messages-${conversationId}`;
    if (prefetchedKeys.current.has(key)) return;
    
    prefetchedKeys.current.add(key);

    await queryClient.prefetchQuery({
      queryKey: ['conversation-messages', conversationId],
      queryFn: async () => {
        const { data } = await supabase
          .from('conversation_messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            message_text,
            message_type,
            created_at,
            is_read,
            sender:profiles!conversation_messages_sender_id_fkey(
              id, full_name, avatar_url
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(50);
        return data || [];
      },
      staleTime: 30 * 1000, // 30 seconds for messages
    });
  }, [queryClient]);

  /**
   * Prefetch next page of notifications
   */
  const prefetchNextNotificationsPage = useCallback(async (
    userId: string,
    offset: number
  ) => {
    const key = `notifications-${offset}`;
    if (prefetchedKeys.current.has(key)) return;
    
    prefetchedKeys.current.add(key);

    await queryClient.prefetchQuery({
      queryKey: ['notifications', userId, offset],
      queryFn: async () => {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + 49);
        return data || [];
      },
      staleTime: 60 * 1000, // 1 minute
    });
  }, [queryClient]);

  /**
   * PERFORMANCE: Prefetch top N conversations when entering messaging
   * Called on messaging screen mount to warm cache for likely-to-open threads
   */
  const prefetchTopConversations = useCallback(async (
    userId: string,
    topN: number = 3
  ) => {
    const key = `top-conversations-${userId}`;
    if (prefetchedKeys.current.has(key)) return;

    prefetchedKeys.current.add(key);

    // Prefetch conversation list
    await queryClient.prefetchQuery({
      queryKey: ['conversations', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('conversations')
          .select(`
            id,
            last_message_at,
            client_id,
            owner_id,
            listing_id
          `)
          .or(`client_id.eq.${userId},owner_id.eq.${userId}`)
          .order('last_message_at', { ascending: false })
          .limit(topN);
        return data || [];
      },
      staleTime: 30 * 1000,
    });
  }, [queryClient]);

  /**
   * PERFORMANCE: Prefetch next listing details when card becomes "next up"
   * Called when user is on card N, prefetch card N+1 details
   */
  const prefetchListingDetails = useCallback(async (
    listingId: string
  ) => {
    const key = `listing-detail-${listingId}`;
    if (prefetchedKeys.current.has(key)) return;

    prefetchedKeys.current.add(key);

    await queryClient.prefetchQuery({
      queryKey: ['listing-detail', listingId],
      queryFn: async () => {
        const { data } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  /**
   * PERFORMANCE: Prefetch next client profile details when card becomes "next up"
   * Called when owner is on card N, prefetch card N+1 details
   */
  const prefetchClientProfileDetails = useCallback(async (
    userId: string
  ) => {
    const key = `client-profile-detail-${userId}`;
    if (prefetchedKeys.current.has(key)) return;

    prefetchedKeys.current.add(key);

    await queryClient.prefetchQuery({
      queryKey: ['client-profile-detail', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  /**
   * Clear prefetch cache when navigating away
   */
  const clearPrefetchCache = useCallback(() => {
    prefetchedKeys.current.clear();
  }, []);

  return {
    prefetchNextSwipeBatch,
    prefetchTopConversationMessages,
    prefetchNextNotificationsPage,
    prefetchTopConversations,
    prefetchListingDetails,
    prefetchClientProfileDetails,
    clearPrefetchCache,
  };
}

/**
 * Hook to automatically prefetch swipe batch when near end
 */
export function useSwipePrefetch(
  currentIndex: number,
  currentPage: number,
  totalInBatch: number,
  _filters?: unknown // Kept for backward compatibility but not used in queryKey
) {
  const { prefetchNextSwipeBatch } = usePrefetchManager();

  useEffect(() => {
    // Prefetch next batch when user reaches card 2-3 of current batch
    // or when remaining cards in batch is less than 5
    const remainingInBatch = totalInBatch - (currentIndex % 10);
    
    if (remainingInBatch <= 5 && remainingInBatch > 0) {
      // Use requestIdleCallback to avoid blocking UI
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(() => {
          prefetchNextSwipeBatch(currentPage);
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          prefetchNextSwipeBatch(currentPage);
        }, 100);
      }
    }
  }, [currentIndex, currentPage, totalInBatch, prefetchNextSwipeBatch]);
}
