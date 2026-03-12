/**
 * FILTER PERSISTENCE HOOK
 * 
 * Connects the Zustand filterStore to the saved_filters database table.
 * Provides automatic sync on filter changes and restoration on mount.
 * 
 * DB columns: id, user_id, filter_data (JSONB), is_active, name, user_role, created_at, updated_at
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore } from '@/state/filterStore';
import { logger } from '@/utils/prodLogger';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';

const DEBOUNCE_MS = 1000;

export function useFilterPersistence() {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(false);
  
  // PERF FIX: Use getState() for reads inside callbacks to avoid subscribing
  // this hook to every filter store change. Only subscribe to what we need for effects.
  const setCategories = useFilterStore((s) => s.setCategories);
  const setListingType = useFilterStore((s) => s.setListingType);
  const setClientGender = useFilterStore((s) => s.setClientGender);
  const setClientType = useFilterStore((s) => s.setClientType);
  const filterVersion = useFilterStore((s) => s.filterVersion);

  // Restore active filter from database on mount
  useEffect(() => {
    if (!user?.id) return;
    
    const restoreActiveFilter = async () => {
      try {
        isRestoringRef.current = true;
        
        const { data, error } = await supabase
          .from('saved_filters')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          logger.error('[FilterPersistence] Error restoring active filter:', error);
          return;
        }

        if (data) {
          logger.info('[FilterPersistence] Restoring active filter:', data.name);
          
          // Read from filter_data JSONB column (the correct column name)
          const filters = data.filter_data as Record<string, unknown> | null;
          
          if (filters) {
            if (Array.isArray(filters.categories)) {
              setCategories(filters.categories as QuickFilterCategory[]);
            }
            if (filters.listingType) {
              setListingType(filters.listingType as QuickFilterListingType);
            }
            if (filters.clientGender) {
              setClientGender(filters.clientGender as 'any' | 'male' | 'female' | 'other' | 'all');
            }
            if (filters.clientType) {
              setClientType(filters.clientType as 'individual' | 'family' | 'business' | 'hire' | 'rent' | 'buy' | 'all');
            }
          }
        }
      } catch (error) {
        logger.error('[FilterPersistence] Unexpected error:', error);
      } finally {
        isRestoringRef.current = false;
      }
    };

    restoreActiveFilter();
  }, [user?.id, setCategories, setListingType, setClientGender, setClientType]);

  // Debounced save function
  const saveFiltersToDb = useCallback(async () => {
    if (!user?.id || isRestoringRef.current) return;

    // Read current values from store at call time (not via subscription)
    const state = useFilterStore.getState();
    const filterData = {
      categories: state.categories,
      listingType: state.listingType,
      clientGender: state.clientGender,
      clientType: state.clientType,
      savedAt: new Date().toISOString(),
    };

    try {
      const { data: existingActive } = await supabase
        .from('saved_filters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingActive) {
        await supabase
          .from('saved_filters')
          .update({
            filter_data: filterData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingActive.id);
        
        logger.info('[FilterPersistence] Updated active filter');
      } else {
        const hasFilters = state.categories.length > 0 || 
                          state.listingType !== 'both' || 
                          state.clientGender !== 'any' || 
                          state.clientType !== 'all';
        
        if (hasFilters) {
          await supabase
            .from('saved_filters')
            .insert({
              user_id: user.id,
              name: 'Current Session',
              filter_data: filterData,
              is_active: true,
              user_role: 'client',
            });
          
          logger.info('[FilterPersistence] Created new session filter');
        }
      }
    } catch (error) {
      logger.error('[FilterPersistence] Error saving filters:', error);
    }
  }, [user?.id]);

  // Watch for filter changes and save with debounce
  useEffect(() => {
    if (!user?.id || isRestoringRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveFiltersToDb();
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [filterVersion, saveFiltersToDb, user?.id]);

  return {
    isRestoring: isRestoringRef.current,
  };
}
