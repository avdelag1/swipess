import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { PropertyInsightsDialog } from '@/components/PropertyInsightsDialog';
import { NotificationBar } from '@/components/NotificationBar';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { supabase } from '@/integrations/supabase/client';
import { ListingFilters } from '@/hooks/useSmartMatching';
import { Listing } from '@/hooks/useListings';
import { useFilterStore } from '@/state/filterStore';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
  filters?: ListingFilters;
}

/**
 * SPEED OF LIGHT: Client Dashboard
 * DashboardLayout is now rendered ONCE at route level via PersistentDashboardLayout
 * This component only renders its inner content
 */
export default function ClientDashboard({
  onPropertyInsights,
  onMessageClick,
  filters
}: ClientDashboardProps) {
  // Connect filter store to swipe container
  const filterVersion = useFilterStore((s) => s.filterVersion);
  const getListingFilters = useFilterStore((s) => s.getListingFilters);
  const storeFilters = useMemo(() => getListingFilters(), [filterVersion]);
  const mergedFilters = useMemo(() => ({ ...filters, ...storeFilters }), [filters, storeFilters]);

  const { notifications, dismissNotification, markAllAsRead, handleNotificationClick } = useNotificationSystem();

  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  return (
    <>
      <NotificationBar
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAllRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
      />
      <SwipessSwipeContainer
        onListingTap={handleListingTap}
        onInsights={handleListingTap}
        onMessageClick={onMessageClick}
        filters={mergedFilters as ListingFilters}
      />
    </>
  );
}

