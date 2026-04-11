import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

const DISCOVERY_QUERY_KEYS = [
  'smart-listings',
  'smart-clients',
  'listings',
  'client-profiles',
  'owner-listings',
  'owner-stats',
  'owner-interested-clients',
  'liked-properties',
  'liked-clients',
] as const;

export function useDiscoveryRealtime() {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef(0);

  const refreshDiscovery = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < 1500) return;
    lastRefreshRef.current = now;

    DISCOVERY_QUERY_KEYS.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  useEffect(() => {
    try {
      const channel = supabase
        .channel('discovery-global-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'listings' },
          () => {
            logger.log('[DiscoveryRealtime] listings changed');
            refreshDiscovery();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            logger.log('[DiscoveryRealtime] profiles changed');
            refreshDiscovery();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'client_profiles' },
          () => {
            logger.log('[DiscoveryRealtime] client_profiles changed');
            refreshDiscovery();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'owner_profiles' },
          () => {
            logger.log('[DiscoveryRealtime] owner_profiles changed');
            refreshDiscovery();
          }
        )
        .subscribe();

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          refreshDiscovery();
        }
      };

      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        supabase.removeChannel(channel);
      };
    } catch (error) {
      logger.error('[DiscoveryRealtime] Failed to initialize realtime sync:', error);
      return () => undefined;
    }
  }, [refreshDiscovery]);
}