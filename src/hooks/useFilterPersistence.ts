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
import { logger } from '@/utils/logger';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';

const DEBOUNCE_MS = 1000;

export function useFilterPersistence() {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);
  
  const {
    categories,
    listingType,
    clientGender,
    clientType,
    setCategories,
    setListingType,
    setClientGender,
    setClientType,
    filterVersion,
  } = useFilterStore();

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

    // Pack everything into filter_data JSONB
    const filterData = {
      categories,
      listingType,
      clientGender,
      clientType,
      savedAt: new Date().toISOString(),
    };

    try {
      // Check if user has an active filter preset
      const { data: existingActive } = await supabase
        .from('saved_filters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingActive) {
        // Update existing active filter — use filter_data column
        await supabase
          .from('saved_filters')
          .update({
            filter_data: filterData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingActive.id);
        
        logger.info('[FilterPersistence] Updated active filter');
      } else {
        // Create a new "Current Session" filter if none exists
        const hasFilters = categories.length > 0 || 
                          listingType !== 'both' || 
                          clientGender !== 'any' || 
                          clientType !== 'all';
        
        if (hasFilters) {
          // Only use columns that exist: user_id, name, filter_data, is_active, user_role
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
  }, [user?.id, categories, listingType, clientGender, clientType]);

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
