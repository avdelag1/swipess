import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

export interface UserSecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  login_alerts: boolean;
  session_timeout: boolean;
  device_tracking: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<UserSecuritySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  two_factor_enabled: false,
  login_alerts: true,
  session_timeout: true,
  device_tracking: true,
};

export function useSecuritySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch security settings - Note: Table may not exist yet
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['security-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const { data, error } = await supabase
          .from('user_security_settings' as any)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // Return defaults if table doesn't exist
          return {
            ...DEFAULT_SETTINGS,
            id: '',
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserSecuritySettings;
        }

        // If no settings exist, return defaults
        if (!data) {
          return {
            ...DEFAULT_SETTINGS,
            id: '',
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserSecuritySettings;
        }

        return data;
      } catch (err) {
        return {
          ...DEFAULT_SETTINGS,
          id: '',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserSecuritySettings;
      }
    },
    enabled: !!user?.id,
  });

  // Update or insert security settings - Note: Table may not exist yet
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserSecuritySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First try to update
      const { data: existingSettings, error: existingError } = await supabase
        .from('user_security_settings' as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        logger.error('Error checking existing security settings:', existingError);
        throw existingError;
      }

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('user_security_settings' as any)
          .update(updates as any)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('user_security_settings' as any)
          .insert({
            user_id: user.id,
            ...DEFAULT_SETTINGS,
            ...updates,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings', user?.id] });
      toast({
        title: 'Settings Updated',
        description: 'Your security settings have been saved successfully.',
      });
    },
    onError: (error) => {
      logger.error('Error updating security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update security settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    isSaving: updateMutation.isPending,
    // Backward compatibility aliases
    loading: isLoading,
    saving: updateMutation.isPending,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
