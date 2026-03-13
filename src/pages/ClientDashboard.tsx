import { useCallback } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
}

/**
 * SPEED OF LIGHT: Client Dashboard
 * DashboardLayout is now rendered ONCE at route level via PersistentDashboardLayout
 * This component only renders its inner content
 * NotificationBar is rendered globally in AppLayout — no duplicate here
 * 
 * PERF FIX: No longer subscribes to filterVersion or creates filter objects.
 * SwipessSwipeContainer reads filters directly from the Zustand store,
 * eliminating the cascading object recreation that caused React Error #185.
 */
export default function ClientDashboard({
  onPropertyInsights,
  onMessageClick,
}: ClientDashboardProps) {
  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  return (
    <SwipessSwipeContainer
      onListingTap={handleListingTap}
      onInsights={handleListingTap}
      onMessageClick={onMessageClick}
    />
  );
}
