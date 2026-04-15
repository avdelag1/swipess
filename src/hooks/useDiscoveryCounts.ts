import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DiscoveryCounts {
  property: number;
  motorcycle: number;
  bicycle: number;
  services: number;
  total: number;
  clients: number;
}

export function useDiscoveryCounts(role: 'client' | 'owner' | string = 'client') {
  return useQuery<DiscoveryCounts>({
    queryKey: ['discovery-counts', role],
    queryFn: async () => {
      const counts: DiscoveryCounts = { property: 0, motorcycle: 0, bicycle: 0, services: 0, total: 0, clients: 0 };

      if (role === 'client' || role === 'owner') {
        // Count active listings by category
        const { data: listings } = await supabase
          .from('listings')
          .select('category')
          .eq('status', 'active');

        if (listings) {
          listings.forEach(l => {
            const cat = l.category as keyof typeof counts;
            if (cat in counts && typeof counts[cat] === 'number') {
              (counts as any)[cat]++;
            }
            counts.total++;
          });
        }
      }

      if (role === 'owner') {
        // Count active client profiles
        const { count } = await supabase
          .from('profiles')
          .select('user_id', { count: 'exact', head: true })
          .eq('role', 'client')
          .eq('is_active', true);
        counts.clients = count || 0;
      }

      return counts;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
