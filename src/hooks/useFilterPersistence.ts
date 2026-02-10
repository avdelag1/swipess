/**
 * FILTER PERSISTENCE HOOK
 * 
 * Connects the Zustand filterStore to the saved_filters database table.
 * Provides automatic sync on filter changes and restoration on mount.
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore } from '@/state/filterStore';
import { logger } from '@/utils/prodLogger';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';
import type { Json } from '@/integrations/supabase/types';

const DEBOUNCE_MS = 1000; // 1 second debounce for saves

/**
 * Hook that automatically persists filter state to the database
 * and restores active filters on app mount.
 */
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
          
          // Restore filter state from database
          const filters = data.filters as Record<string, unknown> | null;
          
          if (filters) {
            // Restore categories if present
            if (Array.isArray(filters.categories)) {
              setCategories(filters.categories as QuickFilterCategory[]);
            }
            
            // Restore listing type if present
            if (filters.listingType) {
              setListingType(filters.listingType as QuickFilterListingType);
            }
            
            // Restore client gender if present (owner mode)
            if (filters.clientGender) {
              setClientGender(filters.clientGender as 'any' | 'male' | 'female' | 'other' | 'all');
            }
            
            // Restore client type if present (owner mode)
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

    const filterData: Json = {
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
        // Update existing active filter
        await supabase
          .from('saved_filters')
          .update({
            filters: filterData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingActive.id);
        
        logger.info('[FilterPersistence] Updated active filter');
      } else {
        // Create a new "Current Session" filter if none exists
        // Only create if there are actual filters applied
        const hasFilters = categories.length > 0 || 
                          listingType !== 'both' || 
                          clientGender !== 'any' || 
                          clientType !== 'all';
        
        if (hasFilters) {
          await supabase
            .from('saved_filters')
            .insert({
              user_id: user.id,
              name: 'Current Session',
              category: categories[0] || 'all',
              mode: 'client', // Default mode
              filters: filterData,
              is_active: true,
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
    // Skip if no user or currently restoring
    if (!user?.id || isRestoringRef.current) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
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
