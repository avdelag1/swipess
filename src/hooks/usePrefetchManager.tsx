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
   * MIRRORS the logic in useSmartListingMatching but for the next page
   */
  const prefetchNextSwipeBatch = useCallback(async (
    userId: string,
    filters: any,
    currentPage: number,
    pageSize: number = 10
  ) => {
    if (!userId) return;

    // CRITICAL: must use JSON.stringify(filters) to match useSmartListingMatching's
    // filtersKey exactly (line 34 of useSmartListingMatching.tsx). A manual key pick
    // produces a different string whenever filters has extra keys, causing cache misses.
    const filtersKey = filters ? JSON.stringify(filters) : '';

    const nextPage = currentPage + 1;
    const key = `smart-listings-${userId}-${filtersKey}-${nextPage}`;

    if (prefetchedKeys.current.has(key)) return;
    prefetchedKeys.current.add(key);

    await queryClient.prefetchQuery({
      queryKey: ['smart-listings', userId, filtersKey, nextPage, false],
      queryFn: async () => {
        try {
          const { data: rpcListings, error: rpcError } = await (supabase as any).rpc('get_smart_listings', {
            p_user_id: userId,
            p_category: (filters?.category === 'all' || !filters?.category) ? null : filters.category,
            p_limit: pageSize,
            p_offset: nextPage * pageSize,
          });
          if (!rpcError && rpcListings && Array.isArray(rpcListings) && rpcListings.length > 0) {
            return (rpcListings as any[]).map((l: any) => ({
              ...l,
              images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : []),
            }));
          }
        } catch (_e) {
          // RPC unavailable — return empty; the live hook handles its own fallback
        }
        return [];
      },
      staleTime: 5 * 60 * 1000,
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
          .select('id, title, description, price, images, city, beds, baths, category, owner_id')
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
          .select('id, full_name, avatar_url, bio, city, user_id')
          .eq('user_id', userId)
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
  userId: string | undefined,
  currentIndex: number,
  currentPage: number,
  totalInBatch: number,
  filters?: any
) {
  const { prefetchNextSwipeBatch } = usePrefetchManager();

  useEffect(() => {
    if (!userId) return;

    // Prefetch next batch when user reaches card 2-3 of current batch
    // or when remaining cards in batch is less than 5
    const remainingInBatch = totalInBatch - (currentIndex % 10);
    
    if (remainingInBatch <= 5 && remainingInBatch > 0) {
      // Use requestIdleCallback to avoid blocking UI
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(() => {
          prefetchNextSwipeBatch(userId, filters, currentPage);
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          prefetchNextSwipeBatch(userId, filters, currentPage);
        }, 100);
      }
    }
  }, [userId, currentIndex, currentPage, totalInBatch, filters, prefetchNextSwipeBatch]);
}

