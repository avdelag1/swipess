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
import { logger } from '@/utils/logger';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: Record<string, unknown>; // Combined quick filters + advanced filters from DashboardLayout
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
  const hydrateOwnerPrefs = useFilterStore((s) => s.hydrateOwnerPrefs);
  const storeGender = useFilterStore((s) => s.clientGender);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!ownerPrefs || hydratedRef.current) return;
    hydratedRef.current = true;

    const genders = ownerPrefs.selected_genders as string[] | null;
    const nationalities = ownerPrefs.preferred_nationalities as string[] | null;

    const updates: Parameters<typeof hydrateOwnerPrefs>[0] = {};
    if (storeGender === 'any' && genders?.length) updates.clientGender = genders[0] as any;
    if (ownerPrefs.min_age != null || ownerPrefs.max_age != null)
      updates.clientAgeRange = [ownerPrefs.min_age ?? 18, ownerPrefs.max_age ?? 65];
    if (ownerPrefs.min_budget != null || ownerPrefs.max_budget != null)
      updates.clientBudgetRange = [ownerPrefs.min_budget ?? 0, ownerPrefs.max_budget ?? 50000];
    if (nationalities?.length) updates.clientNationalities = nationalities;
    if (Object.keys(updates).length > 0) hydrateOwnerPrefs(updates);
  }, [ownerPrefs, storeGender, hydrateOwnerPrefs]);

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
    filterCategory as 'property' | 'moto' | 'bicycle' | undefined,
    0,      // page
    50,     // limit
    false,  // isRefreshMode
    mergedFilters as Record<string, unknown> // FIX: Now includes synced filters!
  );

  if (import.meta.env.DEV) {
    if (error) {
      logger.error('[EnhancedOwnerDashboard] Profile fetch error:', error);
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
        category={filterCategory || 'default'}
        filters={mergedFilters}
      />
    </>
  );
};

// Memoize to prevent re-renders from parent state changes
export default memo(EnhancedOwnerDashboard);
