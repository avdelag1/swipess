import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch unread count from notifications table
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await (supabase as any)
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        // Silently handle errors - not critical
        return;
      }

      if (isMountedRef.current) {
        setUnreadCount(count || 0);
      }
    } catch {
      // Silently handle errors - not critical
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  // Debounced refetch to prevent excessive queries
  const debouncedRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      fetchUnreadCount();
    }, 500); // 500ms debounce
  }, [fetchUnreadCount]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!user?.id) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    fetchUnreadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('unread-notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Debounced refetch on any change
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      // Properly unsubscribe before removing channel
      channel.unsubscribe();
    };
  }, [user?.id, fetchUnreadCount, debouncedRefetch]);

  return {
    unreadCount,
    isLoading
  };
}
