/**
 * FILTER PERSISTENCE HOOK
 * 
 * Connects the Zustand filterStore to the saved_filters database table.
 * Provides automatic sync on filter changes and restoration on mount.
 * 
 * PERF FIX: Uses getState() for ALL reads to avoid subscribing this hook
 * to filter store changes. Only subscribes to filterVersion for the save trigger.
 * Uses didMountRef to skip saving on the initial restore.
 * 
 * DB columns: id, user_id, filter_data (JSONB), is_active, name, user_role, created_at, updated_at
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore } from '@/state/filterStore';
import { logger } from '@/utils/prodLogger';

const DEBOUNCE_MS = 1500;

export function useFilterPersistence() {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(false);
  const didMountRef = useRef(false);
  const [restoreComplete, setRestoreComplete] = useState(false);

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
          
          const filters = data.filter_data as Record<string, unknown> | null;
          
          if (filters) {
            // Batch all filter restorations using setFilters to bump filterVersion only ONCE
            const store = useFilterStore.getState();
            const updates: Record<string, unknown> = {};
            
            if (Array.isArray(filters.categories)) {
              updates.categories = filters.categories;
            }
            if (filters.listingType) {
              updates.listingType = filters.listingType;
            }
            if (filters.clientGender) {
              updates.clientGender = filters.clientGender;
            }
            if (filters.clientType) {
              updates.clientType = filters.clientType;
            }
            
            if (Object.keys(updates).length > 0) {
              store.setFilters(updates as any);
            }
          }
        }
      } catch (error) {
        logger.error('[FilterPersistence] Unexpected error:', error);
      } finally {
        isRestoringRef.current = false;
        setRestoreComplete(true);
      }
    };

    restoreActiveFilter();
  }, [user?.id]);

  // Debounced save function — reads from store at call time (no subscription)
  const saveFiltersToDb = useCallback(async () => {
    if (!user?.id || isRestoringRef.current) return;

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
        // PROACTIVE PERSISTENCE: Ensure clean state by deactivating any existing active filters
        // though maybeSingle of line 102 suggests there's at most one, we want to be certain.
        await supabase
          .from('saved_filters')
          .update({ is_active: false })
          .eq('user_id', user.id);

        await supabase
          .from('saved_filters')
          .insert({
            user_id: user.id,
            name: 'Current Session',
            filter_data: filterData,
            is_active: true,
            user_role: 'client',
          });
        
        logger.info('[FilterPersistence] Created new session filter (including possible All state)');
      }
    } catch (error) {
      logger.error('[FilterPersistence] Error saving filters:', error);
    }
  }, [user?.id]);

  // Watch for filter changes via Zustand subscribe (non-reactive)
  // This avoids re-rendering this hook's parent on every filterVersion bump
  useEffect(() => {
    if (!user?.id || !restoreComplete) return;

    // Skip the first trigger after restore completes — that IS the restore
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const unsub = useFilterStore.subscribe(
      (state) => state.filterVersion,
      (version, prevVersion) => {
        if (isRestoringRef.current) return;
        if (version === prevVersion) return;

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          saveFiltersToDb();
        }, DEBOUNCE_MS);
      }
    );

    return () => {
      unsub();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user?.id, restoreComplete, saveFiltersToDb]);

  return {
    isRestoring: isRestoringRef.current,
  };
}

