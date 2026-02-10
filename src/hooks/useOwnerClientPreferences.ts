import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

export interface OwnerClientPreferences {
  id?: string;
  user_id: string;
  min_budget?: number;
  max_budget?: number;
  min_age?: number;
  max_age?: number;
  compatible_lifestyle_tags?: string[];
  allows_pets?: boolean;
  allows_smoking?: boolean;
  allows_parties?: boolean;
  no_smoking?: boolean;
  requires_employment_proof?: boolean;
  requires_references?: boolean;
  min_monthly_income?: number;
  preferred_occupations?: string[];
  preferred_nationalities?: string[];

  // New comprehensive demographic filters
  selected_genders?: string[];
  selected_nationalities?: string[];
  selected_languages?: string[];
  selected_relationship_status?: string[];
  allows_children?: boolean | null;

  // New lifestyle habit filters
  smoking_habit?: string;
  drinking_habit?: string;
  cleanliness_level?: string;
  noise_tolerance?: string;
  work_schedule?: string;

  // New cultural and personality filters
  selected_dietary_preferences?: string[];
  selected_personality_traits?: string[];
  selected_interests?: string[];

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

      if (error) throw error;
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
        })
        .select()
        .single();

      if (error) throw error;
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