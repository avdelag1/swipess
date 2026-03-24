import { useState, useEffect, useRef, memo, useMemo, lazy, useCallback } from 'react';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
import { TinderTopNav } from '@/components/TinderTopNav';
import { QuickFilterDropdown } from '@/components/QuickFilterDropdown';
// Lazy-load: 50kb dialog only needed post-tap, not on initial dashboard render
const _ClientInsightsDialog = lazy(() =>
  import('@/components/ClientInsightsDialog').then(m => ({ default: m.ClientInsightsDialog }))
);
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { User, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientFilters } from '@/hooks/useSmartMatching';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any; 
}

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const [_selectedClientId, _setSelectedClientId] = useState<string | null>(null);
  const [_insightsOpen, _setInsightsOpen] = useState(false);

  const [_showCategoryDialog, _setShowCategoryDialog] = useState(false);

  const _navigate = useNavigate();
  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user, loading: isAuthLoading } = useAuth();

  // Hydrate owner filter store from DB on mount
  const { preferences: ownerPrefs, isLoading: isPrefsLoading } = useOwnerClientPreferences();
  const { setClientGender, setClientAgeRange, setClientBudgetRange, setClientNationalities, storeGender, setCategories, storeCategories } = useFilterStore(
    useShallow((s) => ({
      setClientGender: s.setClientGender,
      setClientAgeRange: s.setClientAgeRange,
      setClientBudgetRange: s.setClientBudgetRange,
      setClientNationalities: s.setClientNationalities,
      storeGender: s.clientGender,
      setCategories: s.setCategories,
      storeCategories: s.categories,
    }))
  );
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!ownerPrefs || hydratedRef.current) return;
    hydratedRef.current = true;

    const genders = ownerPrefs.selected_genders as string[] | null;
    const nationalities = ownerPrefs.preferred_nationalities as string[] | null;

    if (storeGender === 'any' && genders?.length) {
      setClientGender(genders[0] as any);
    }
    if (ownerPrefs.min_age != null || ownerPrefs.max_age != null) {
      setClientAgeRange([ownerPrefs.min_age ?? 18, ownerPrefs.max_age ?? 65]);
    }
    if (ownerPrefs.min_budget != null || ownerPrefs.max_budget != null) {
      setClientBudgetRange([ownerPrefs.min_budget ?? 0, ownerPrefs.max_budget ?? 50000]);
    }
    if (nationalities?.length) {
      setClientNationalities(nationalities);
    }
  }, [ownerPrefs, storeGender, setClientGender, setClientAgeRange, setClientBudgetRange, setClientNationalities]);

  // PERF FIX: Read owner CLIENT filters from store — use getClientFilters() NOT getListingFilters().
  // getListingFilters() produces listing/category filters for the CLIENT swipe deck.
  // getClientFilters() produces the correct {clientGender, ageRange, budgetRange, ...} shape
  // that useSmartClientMatching understands.
  const storeFilterVersion = useFilterStore((s) => s.filterVersion);
  const clientFilters = useMemo(() => {
    return useFilterStore.getState().getClientFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilterVersion]);

  // Merge any prop-passed filters with store client filters (store takes precedence)
  const mergedFilters = useMemo(() => {
    return { ...filters, ...clientFilters };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilterVersion, filters]);

  // FIX: Pass filters to query so fetched profiles match what container displays
  // Extract category from filters if available
  const filterCategory = mergedFilters?.categories?.[0] || undefined;
  const { data: clientProfiles = [], isLoading, error } = useSmartClientMatching(
    user?.id,
    filterCategory,
    0,      // page
    50,     // limit
    false,  // isRefreshMode
    mergedFilters as ClientFilters
  );

  if (import.meta.env.DEV && error) {
    console.error('[EnhancedOwnerDashboard] Profile fetch error:', error);
  }

  const handleClientTap = (clientId: string) => {
    onClientInsights?.(clientId);
  };

  const handleInsights = (clientId: string) => {
    onClientInsights?.(clientId);
  };

  // Loading state handling
  if (isAuthLoading || isPrefsLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Owner Experience...</p>
        </div>
      </div>
    );
  }

  // Error/Auth state check
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-center bg-background/50 backdrop-blur-md">
        <div className="max-w-xs space-y-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto border border-red-500/30">
            <Megaphone className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Sync Interrupted</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We couldn't reach the matching engine. This usually fixes itself in a few seconds.
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline" 
            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            Reconnect
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold">Access Required</h2>
          <p className="text-sm text-muted-foreground">Please log in to access the owner dashboard features.</p>
        </div>
      </div>
    );
  }

  // ── Tinder-style top nav for owner ────────────────────────────────────────
  const OWNER_TABS = [
    { id: 'all', label: 'For You' },
    { id: 'property', label: 'Renters' },
    { id: 'motorcycle', label: 'Riders' },
    { id: 'bicycle', label: 'Cyclists' },
    { id: 'services', label: 'Freelancers' },
  ];
  const ownerActiveNavTab = storeCategories.length === 0 ? 'all' : (storeCategories[0] || 'all');

  const handleOwnerNavTabChange = useCallback((id: string) => {
    if (id === 'all') {
      setCategories([]);
    } else {
      setCategories([id as any]);
    }
  }, [setCategories]);

  // NotificationBar is rendered globally in AppLayout — no duplicate here
  return (
    <div className="flex flex-col h-full w-full">
      <TinderTopNav
        tabs={OWNER_TABS}
        activeTab={ownerActiveNavTab}
        onTabChange={handleOwnerNavTabChange}
        filterSlot={<QuickFilterDropdown userRole="owner" />}
        onBoostClick={() => {}}
      />
      <div className="flex-1 min-h-0">
        <ClientSwipeContainer
          onClientTap={handleClientTap}
          onInsights={handleInsights}
          onMessageClick={onMessageClick}
          profiles={clientProfiles}
          isLoading={isLoading}
          error={error}
          insightsOpen={false}
          category={filterCategory || 'default'}
          filters={mergedFilters}
        />
      </div>
    </div>
  );
};

// Memoize to prevent re-renders from parent state changes
export default memo(EnhancedOwnerDashboard);
