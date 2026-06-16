import { useContext, useEffect } from 'react';
import { AuthContext } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { runIdleTask } from '@/lib/utils';
import { logger } from '@/utils/prodLogger';
import { prefetchRoute } from '@/utils/routePrefetcher';
import { prefetchPassportMapModule } from '@/utils/prefetchMapModule';
import { prefetchCityPhotos } from '@/utils/prefetchCityPhotos';
import { prefetchConciergeChatModule } from '@/utils/prefetchConciergeChat';
import { warmDiscoveryCache } from '@/utils/performance';

/**
 * 🚀 SwipessPrewarmer: Predictive data & asset pre-fetching
 * - Silently warms the React Query cache based on user role
 * - Pre-fetches high-priority brand assets
 * - Essential for 'Speed of Light' navigation experience
 */
export const SwipessPrewarmer = () => {
  const ctx = useContext(AuthContext as any) as { user?: any } | undefined;
  const user = ctx?.user;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    runIdleTask(async () => {
      const role = user.user_metadata?.role || 'client';
      const dashboardPath = '/client/dashboard';
      const profilePath = '/client/profile';
      
      logger.info(`[SwipessPrewarmer] Warming cache for ${role} role...`);

      // 🔥 SPEED OF LIGHT: Start fetching the DASHBOARD CODE immediately
      // This ensures the JS chunk is in the browser cache before they click.
      prefetchRoute(dashboardPath);
      prefetchRoute(profilePath);
      prefetchRoute('/messages');
      // Hot follow-up routes users hit right after dashboard
      prefetchRoute('/client/filters');
      prefetchRoute('/explore/events');
      prefetchRoute('/notifications');
      prefetchPassportMapModule();
      prefetchCityPhotos();
      prefetchConciergeChatModule();

      // Pre-decode poker filter card photos so the quick-filter deck snaps in
      try {
        const { POKER_CARD_PHOTOS } = await import('@/components/swipe/CardData');
        Object.values(POKER_CARD_PHOTOS).forEach((src) => {
          const img = new Image();
          (img as any).fetchPriority = 'high';
          img.decoding = 'async';
          img.src = src as string;
          if ('decode' in img) img.decode().catch(() => {});
        });
      } catch {
        // ignore pre-decoding errors
      }

      // 1. Pre-warm Discover Data (High Priority)
      // We use the exact key structure from useSmartListingMatching for 'Default' filter state
      if (role === 'client') {
        await warmDiscoveryCache(queryClient, user.id, 'client');
      }

      // 2. Pre-warm Persistent Shared Data
      // Token packages prefetch removed — no queryFn was defined

      // 🚀 PHASE 2: Predictive DNS / TCP Pre-resolution
      // Shaves 100-300ms off initial external resource fetches
      const domains = [
        'https://supabase.co',
        'https://images.unsplash.com',
        'https://v5.airtableavatars.com',
        'https://api.dicebear.com',
        'https://api.mapbox.com',
        'https://events.mapbox.com',
      ];
      domains.forEach(domain => {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = domain;
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);

        const dnsPrefetch = document.createElement('link');
        dnsPrefetch.rel = 'dns-prefetch';
        dnsPrefetch.href = domain;
        document.head.appendChild(dnsPrefetch);
      });

      // 3. Pre-warm Critical UI Assets & Branding (only essential)
      const prefetchImages = [
         '/icons/icon-192.png',
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


