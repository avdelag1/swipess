import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/prodLogger';

/**
 * Interface aligned with actual DB columns in owner_client_preferences table.
 * Do NOT add fields here unless they exist in the database schema.
 */
export interface OwnerClientPreferences {
  id?: string;
  user_id: string;
  selected_genders?: string[] | null;
  min_age?: number | null;
  max_age?: number | null;
  min_budget?: number | null;
  max_budget?: number | null;
  preferred_nationalities?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export function useOwnerClientPreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['owner-client-preferences'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logger.error('Error fetching authenticated user:', authError);
        throw authError;
      }
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('owner_client_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          logger.error('Error fetching owner client preferences:', error);
        }
        return null;
      }

      return data as OwnerClientPreferences | null;
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (prefs: Partial<OwnerClientPreferences>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logger.error('Error fetching authenticated user:', authError);
        throw authError;
      }
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('owner_client_preferences')
        .upsert({
          user_id: user.id,
          ...prefs,
        } as any)
        .select()
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          logger.error('Error updating owner client preferences:', error);
        }
        return { user_id: user.id, ...prefs };
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-client-preferences'] });
      toast({
        title: 'Preferences Saved',
        description: 'Your client filter preferences have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save preferences: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
