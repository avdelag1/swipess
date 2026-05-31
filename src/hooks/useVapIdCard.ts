import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VapIdCardData {
  id?: string;
  user_id: string;
  name?: string | null;
  age?: number | null;
  country?: string | null;
  bio?: string | null;
  occupation?: string | null;
  city?: string | null;
  nationality?: string | null;
  years_in_city?: number | null;
  languages?: string[] | null;
  interests?: string[] | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

const VAP_CARD_QUERY_KEY = 'vap-id-card';

export function useVapIdCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [VAP_CARD_QUERY_KEY, user?.id],
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('vap_id_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as VapIdCardData | null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (card: Omit<VapIdCardData, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not signed in');

      // Upsert: try insert, on conflict update
      const { data, error } = await supabase
        .from('vap_id_cards')
        .upsert({ ...card, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data as VapIdCardData;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [VAP_CARD_QUERY_KEY, user?.id] });
      // Also invalidate the legacy client_profile queries if any consumers use them
      queryClient.invalidateQueries({ queryKey: ['vap-id-client-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['client-profile-own'] });
    },
  });

  return {
    card: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    refetch: query.refetch,
  };
}
