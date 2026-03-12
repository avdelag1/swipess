import { useCallback, useMemo } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { ListingFilters } from '@/hooks/useSmartMatching';
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
 * NotificationBar is rendered globally in AppLayout — no duplicate here
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

  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  return (
    <SwipessSwipeContainer
      onListingTap={handleListingTap}
      onInsights={handleListingTap}
      onMessageClick={onMessageClick}
      filters={mergedFilters as ListingFilters}
    />
  );
}

