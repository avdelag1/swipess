/**
 * SAVED FILTERS HOOK
 * 
 * Manages saved filter presets in the saved_filters table.
 * DB columns: id, user_id, filter_data (JSONB), is_active, name, user_role, created_at, updated_at
 * 
 * All filter parameters are packed into the filter_data JSONB column.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import type { Database, Json } from '@/integrations/supabase/types';
import { logger } from '@/utils/prodLogger';

export type SavedFilterRow = Database['public']['Tables']['saved_filters']['Row'];

export interface SavedFilterInput {
  name: string;
  user_role: string;
  filter_data: {
    category?: string;
    categories?: string[];
    mode?: string;
    listing_types?: string[];
    client_types?: string[];
    min_budget?: number;
    max_budget?: number;
    min_age?: number;
    max_age?: number;
    lifestyle_tags?: string[];
    preferred_occupations?: string[];
    allows_pets?: boolean;
    allows_smoking?: boolean;
    allows_parties?: boolean;
    requires_employment_proof?: boolean;
    requires_references?: boolean;
    min_monthly_income?: number;
    // Worker-specific
    service_category?: string;
    work_type?: string[];
    schedule_type?: string[];
    days_available?: string[];
    experience_level?: string;
    skills?: string[];
    [key: string]: unknown;
  };
  is_active?: boolean;
}

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilterRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<SavedFilterRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSavedFilters = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setSavedFilters(data);
        const active = data.find(f => Boolean(f.is_active));
        setActiveFilter(active || null);
      }
    } catch (error) {
      logger.error('Error loading saved filters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved filters',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  const saveFilter = async (filter: SavedFilterInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to save filters',
          variant: 'destructive',
        });
        return;
      }

      // Check if filter with same name exists
      const { data: existing } = await supabase
        .from('saved_filters')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', filter.name)
        .maybeSingle();

      if (existing) {
        // Update existing filter — pack everything into filter_data
        const { error } = await supabase
          .from('saved_filters')
          .update({
            filter_data: filter.filter_data as unknown as Json,
            user_role: filter.user_role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;

        toast({
          title: 'Filter Updated',
          description: `"${filter.name}" has been updated successfully`,
        });
      } else {
        // Create new filter
        const { error } = await supabase
          .from('saved_filters')
          .insert({
            user_id: user.id,
            name: filter.name,
            filter_data: filter.filter_data as unknown as Json,
            user_role: filter.user_role,
            is_active: filter.is_active ?? false,
          });

        if (error) throw error;

        toast({
          title: 'Filter Saved',
          description: `"${filter.name}" has been saved successfully`,
        });
      }

      await loadSavedFilters();
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error saving filter:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save filter',
        variant: 'destructive',
      });
    }
  };

  const deleteFilter = async (filterId: string) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', filterId);

      if (error) throw error;

      toast({
        title: 'Filter Deleted',
        description: 'Your saved filter has been deleted',
      });

      await loadSavedFilters();
    } catch (error) {
      logger.error('Error deleting filter:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete filter',
        variant: 'destructive',
      });
    }
  };

  const setAsActive = async (filterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deactivate all filters first
      await supabase
        .from('saved_filters')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Set selected filter as active
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_active: true })
        .eq('id', filterId);

      if (error) throw error;

      // Sync filter_data to owner_client_preferences if applicable
      const filter = savedFilters.find(f => f.id === filterId);
      if (filter) {
        const fd = filter.filter_data as Record<string, unknown> | null;
        if (fd) {
          await supabase
            .from('owner_client_preferences')
            .upsert({
              user_id: user.id,
              min_budget: (fd.min_budget as number) ?? null,
              max_budget: (fd.max_budget as number) ?? null,
              min_age: (fd.min_age as number) ?? null,
              max_age: (fd.max_age as number) ?? null,
              selected_genders: (fd.selected_genders as Json) ?? [],
              preferred_nationalities: (fd.preferred_nationalities as Json) ?? [],
            });
        }
      }

      toast({
        title: 'Filter Activated',
        description: 'This filter is now active for client discovery',
      });

      await loadSavedFilters();
    } catch (error) {
      logger.error('Error setting active filter:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate filter',
        variant: 'destructive',
      });
    }
  };

  const applyFilter = async (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (!filter) return null;

    await setAsActive(filterId);
    return filter;
  };

  return {
    savedFilters,
    activeFilter,
    loading,
    saveFilter,
    deleteFilter,
    setAsActive,
    applyFilter,
    loadSavedFilters,
  };
}

