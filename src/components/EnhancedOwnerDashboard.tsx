import { useState, useEffect, useRef, memo, useMemo, lazy, Suspense } from 'react';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
// Lazy-load: 50kb dialog only needed post-tap, not on initial dashboard render
const ClientInsightsDialog = lazy(() =>
  import('@/components/ClientInsightsDialog').then(m => ({ default: m.ClientInsightsDialog }))
);
import { NotificationBar } from '@/components/NotificationBar';
import { CategorySelectionDialog } from '@/components/CategorySelectionDialog';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '@/state/filterStore';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any; // Combined quick filters + advanced filters from DashboardLayout
}

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  const navigate = useNavigate();
  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();

  // Hydrate owner filter store from DB on mount
  const { preferences: ownerPrefs } = useOwnerClientPreferences();
  const setClientGender = useFilterStore((s) => s.setClientGender);
  const setClientAgeRange = useFilterStore((s) => s.setClientAgeRange);
  const setClientBudgetRange = useFilterStore((s) => s.setClientBudgetRange);
  const setClientNationalities = useFilterStore((s) => s.setClientNationalities);
  const storeGender = useFilterStore((s) => s.clientGender);

  useEffect(() => {
    if (ownerPrefs && storeGender === 'any' && ownerPrefs.selected_genders?.length) {
      setClientGender(ownerPrefs.selected_genders[0] as any);
    }
    if (ownerPrefs?.min_age != null || ownerPrefs?.max_age != null) {
      setClientAgeRange([ownerPrefs?.min_age ?? 18, ownerPrefs?.max_age ?? 65]);
    }
    if (ownerPrefs?.min_budget != null || ownerPrefs?.max_budget != null) {
      setClientBudgetRange([ownerPrefs?.min_budget ?? 0, ownerPrefs?.max_budget ?? 50000]);
    }
    if (ownerPrefs?.preferred_nationalities?.length) {
      setClientNationalities(ownerPrefs.preferred_nationalities);
    }
  }, [ownerPrefs, storeGender, setClientGender, setClientAgeRange, setClientBudgetRange, setClientNationalities]);

  // Connect filter store to swipe container (fixes missing filters when rendered as a route)
  const filterVersion = useFilterStore((s) => s.filterVersion);
  const getListingFilters = useFilterStore((s) => s.getListingFilters);
  const storeFilters = useMemo(() => getListingFilters(), [filterVersion]);
  const mergedFilters = useMemo(() => ({ ...filters, ...storeFilters }), [filters, storeFilters]);

  // FIX: Pass filters to query so fetched profiles match what container displays
  // Extract category from filters if available
  const filterCategory = mergedFilters?.categories?.[0] || mergedFilters?.category || undefined;
  if (import.meta.env.DEV) console.log('[EnhancedOwnerDashboard] Rendering with filters:', mergedFilters);
  const { data: clientProfiles = [], isLoading, error } = useSmartClientMatching(
    user?.id,
    filterCategory as any,
    0,      // page
    50,     // limit
    false,  // isRefreshMode
    mergedFilters as any // FIX: Now includes synced filters!
  );

  if (import.meta.env.DEV) {
    if (error) {
      console.error('[EnhancedOwnerDashboard] Profile fetch error:', error);
    } else {
      console.log('[EnhancedOwnerDashboard] Fetched profiles count:', clientProfiles.length);
    }
  }

  const { notifications, dismissNotification, markAllAsRead, handleNotificationClick } = useNotificationSystem();

  const handleClientTap = (clientId: string) => {
    onClientInsights?.(clientId);
  };

  const handleInsights = (clientId: string) => {
    onClientInsights?.(clientId);
  };

  return (
    <>
      <NotificationBar
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAllRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
      />
      <ClientSwipeContainer
        onClientTap={handleClientTap}
        onInsights={handleInsights}
        onMessageClick={onMessageClick}
        profiles={clientProfiles}
        isLoading={isLoading}
        error={error}
        insightsOpen={false} // Insights handled by layout now
        filters={mergedFilters}
      />
    </>
  );
};

// Memoize to prevent re-renders from parent state changes
export default memo(EnhancedOwnerDashboard);