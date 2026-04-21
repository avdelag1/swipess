import { useEffect, memo } from 'react';
import { prefetchRoleRoutes } from '@/utils/routePrefetcher';

/**
 * Lightweight preloader — only prefetches routes based on predicted role.
 * Image pre-decoding removed (handled by browser natively with loading="lazy").
 */
export const SpeedOfLightPreloader = memo(() => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const role = (window as any).__PREDICTED_ROLE === 'owner' ? 'owner' : 'client';
      prefetchRoleRoutes(role);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
});

SpeedOfLightPreloader.displayName = 'SpeedOfLightPreloader';


