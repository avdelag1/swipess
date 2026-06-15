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

import { useCallback, useEffect, useRef, useState } from 'react';
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
            if (typeof filters.radiusKm === 'number') {
              updates.radiusKm = filters.radiusKm;
            }
            if (typeof filters.userLatitude === 'number') {
              updates.userLatitude = filters.userLatitude;
            }
            if (typeof filters.userLongitude === 'number') {
              updates.userLongitude = filters.userLongitude;
            }
            if (typeof filters.passportMode === 'boolean') {
              updates.passportMode = filters.passportMode;
            }
            if (filters.passportLabel) {
              updates.passportLabel = filters.passportLabel as string;
            }
            if (Array.isArray(filters.priceRange)) {
              updates.priceRange = filters.priceRange;
            }
            if (Array.isArray(filters.bedrooms)) {
              updates.bedrooms = filters.bedrooms;
            }
            if (Array.isArray(filters.bathrooms)) {
              updates.bathrooms = filters.bathrooms;
            }
            if (Array.isArray(filters.amenities)) {
              updates.amenities = filters.amenities;
            }
            if (Array.isArray(filters.propertyTypes)) {
              updates.propertyTypes = filters.propertyTypes;
            }
            if (Array.isArray(filters.serviceTypes)) {
              updates.serviceTypes = filters.serviceTypes;
            }
            if (Array.isArray(filters.motoTypes)) {
              updates.motoTypes = filters.motoTypes;
            }
            if (Array.isArray(filters.bicycleTypes)) {
              updates.bicycleTypes = filters.bicycleTypes;
            }
            if (typeof filters.furnished === 'boolean') {
              updates.furnished = filters.furnished;
            }
            if (typeof filters.petFriendly === 'boolean') {
              updates.petFriendly = filters.petFriendly;
            }
            if (Object.keys(updates).length > 0) {
              store.setFilters(updates as any);
            }
            if (Array.isArray(filters.clientAgeRange)) {
              store.setClientAgeRange(filters.clientAgeRange as [number, number]);
            }
            if (Array.isArray(filters.clientBudgetRange)) {
              store.setClientBudgetRange(filters.clientBudgetRange as [number, number]);
            }
            if (Array.isArray(filters.clientNationalities)) {
              store.setClientNationalities(filters.clientNationalities as string[]);
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
      radiusKm: state.radiusKm,
      userLatitude: state.userLatitude,
      userLongitude: state.userLongitude,
      passportMode: state.passportMode,
      passportLabel: state.passportLabel,
      priceRange: state.priceRange,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      amenities: state.amenities,
      propertyTypes: state.propertyTypes,
      serviceTypes: state.serviceTypes,
      motoTypes: state.motoTypes,
      bicycleTypes: state.bicycleTypes,
      furnished: state.furnished,
      petFriendly: state.petFriendly,
      clientAgeRange: state.clientAgeRange,
      clientBudgetRange: state.clientBudgetRange,
      clientNationalities: state.clientNationalities,
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
        const { error: updateErr } = await supabase
          .from('saved_filters')
          .update({
            filter_data: filterData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingActive.id);
        if (updateErr) throw updateErr;
        logger.info('[FilterPersistence] Updated active filter');
      } else {
        // Deactivate any stale active filters before creating a new one
        const { error: deactivateErr } = await supabase.from('saved_filters').update({ is_active: false }).eq('user_id', user.id);
        if (deactivateErr) logger.warn('[FilterPersistence] deactivate error:', deactivateErr);

        const { error: insertErr } = await supabase
          .from('saved_filters')
          .insert({
            user_id: user.id,
            name: 'Current Session',
            filter_data: filterData,
            is_active: true,
            user_role: 'client',
          });
        if (insertErr) throw insertErr;
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


