import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { runIdleTask } from '@/lib/utils';
import { logger } from '@/utils/prodLogger';
import { prefetchRoute } from '@/utils/routePrefetcher';

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
      const dashboardPath = role === 'owner' ? '/owner/dashboard' : '/client/dashboard';
      const profilePath = role === 'owner' ? '/owner/profile' : '/client/profile';
      
      logger.info(`[ZenithPrewarmer] Warming cache for ${role} role...`);

      // 🔥 SPEED OF LIGHT: Start fetching the DASHBOARD CODE immediately
      // This ensures the JS chunk is in the browser cache before they click.
      prefetchRoute(dashboardPath);
      prefetchRoute(profilePath);
      prefetchRoute('/messages');

      // 1. Pre-warm Discover Data (High Priority)
      // We use the exact key structure from useSmartListingMatching for 'Default' filter state
      if (role === 'client') {
        queryClient.prefetchQuery({
          queryKey: ['smart-listings', user.id, '', 0, false],
          staleTime: 5 * 60 * 1000,
        });
      } else if (role === 'owner') {
        queryClient.prefetchQuery({
          queryKey: ['smart-clients', user.id, '', 0, false],
          staleTime: 5 * 60 * 1000,
        });
      }

      // 2. Pre-warm Persistent Shared Data
      runIdleTask(() => {

        queryClient.prefetchQuery({
          queryKey: ['topbar-token-packages', role === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use'],
          staleTime: 1000 * 60 * 60 * 24,
        });
      });

      // 3. Pre-warm Critical UI Assets & Branding
      const prefetchImages = [
         '/icons/fire-s-logo-960.webp',
         '/placeholder.svg',
         '/swipess-logo.png'
      ];
      
      prefetchImages.forEach(src => {
        const img = new Image();
        img.src = src;
        // Direct-to-GPU decoding hint
        if ('decode' in img) {
          img.decode().catch(() => {});
        }
      });
    });
  }, [user, queryClient]);

  return null;
};
