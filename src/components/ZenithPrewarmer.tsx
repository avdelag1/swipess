import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { runIdleTask } from '@/lib/utils';
import { logger } from '@/utils/prodLogger';
import { prefetchRoute } from '@/utils/routePrefetcher';
import { warmDiscoveryCache } from '@/utils/performance';

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
        'https://api.dicebear.com'
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


