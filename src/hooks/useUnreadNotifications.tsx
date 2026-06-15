import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  // Unique per hook instance so multiple consumers (e.g. the notification
  // popover AND the app-icon badge) don't collide on the same channel name.
  const channelIdRef = useRef(Math.random().toString(36).slice(2));

  // Fetch unread count from notifications table
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
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
      .channel(`unread-notifications-count-${channelIdRef.current}`)
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
      // Properly unsubscribe AND remove channel to prevent memory leaks
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadCount, debouncedRefetch]);

  return {
    unreadCount,
    isLoading
  };
}


