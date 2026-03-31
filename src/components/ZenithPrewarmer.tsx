import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { runIdleTask } from '@/lib/utils';
import { logger } from '@/utils/prodLogger';

/**
 * 🚀 ZenithPrewarmer: Predictive data & asset pre-fetching
 * - Silently warms the React Query cache based on user role
 * - Pre-fetches high-priority brand assets
 * - Essential for 'Speed of Light' navigation experience
 */
export const ZenithPrewarmer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    runIdleTask(async () => {
      const role = user.user_metadata?.role || 'client';
      logger.info(`[ZenithPrewarmer] Warming cache for ${role} role...`);

      // 1. Pre-warm Discover Data (High Priority)
      // This ensures that when the user taps 'Dashboard', the items are ALREADY in cache.
      if (role === 'client') {
        queryClient.prefetchQuery({
          queryKey: ['smart-listings', user.id],
          staleTime: 5 * 60 * 1000,
        });
      } else if (role === 'owner') {
        queryClient.prefetchQuery({
          queryKey: ['smart-clients', user.id],
          staleTime: 5 * 60 * 1000,
        });
      }

      // 2. Pre-warm Important Shared Data
      runIdleTask(() => {
        queryClient.prefetchQuery({
          queryKey: ['unread-messages-count', user.id],
          staleTime: 60 * 1000,
        });
        
        queryClient.prefetchQuery({
          queryKey: ['event-likes', user.id],
          staleTime: 5 * 60 * 1000,
        });
      });

      // 3. Pre-warm Critical Assets
      const prefetchImages = [
         '/icons/fire-s-logo-960.webp',
         '/placeholder.svg'
      ];
      
      prefetchImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    });
  }, [user, queryClient]);

  return null;
};
