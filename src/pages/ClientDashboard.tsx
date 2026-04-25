import { useCallback, useMemo } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { QuickFilterBar } from '@/components/QuickFilterBar';
import type { QuickFilterCategory } from '@/types/filters';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useSmartListingMatching } from '@/hooks/smartMatching/useSmartListingMatching';
import { useAuth } from '@/hooks/useAuth';

interface ClientDashboardProps {
  onMessageClick?: () => void;
}

export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const { setActiveCategory, setCategories } = useFilterActions();

  const filterVersion = useFilterStore(s => s.filterVersion);
  const filters = useFilterStore(s => s.getListingFilters());
  const quickFilters = useFilterStore(s => ({
    categories: s.categories,
    listingType: s.listingType,
    clientGender: s.clientGender,
    clientType: s.clientType,
  }));

  // Pre-fetch listing data during render for instant swipe deck
  useSmartListingMatching(user?.id, [], filters, 0, 20, false);

  const handleCategorySelect = useCallback((category: QuickFilterCategory) => {
    setActiveCategory(category);
  }, [setActiveCategory]);

  const handleFilterChange = useCallback((newFilters: any) => {
    setCategories(newFilters.categories ?? []);
  }, [setCategories]);

  return (
    <div className={cn(
      "flex-1 flex flex-col overflow-hidden relative w-full h-full",
      isLight ? "bg-white" : "bg-[#020202]"
    )}>
      {/* Quick Filter Bar — always visible at the top, below the TopBar */}
      <div
        className="relative z-20 w-full"
        style={{ paddingTop: 'calc(var(--top-bar-height, 56px) + var(--safe-top, 0px) + 4px)' }}
      >
        <QuickFilterBar
          filters={quickFilters}
          onChange={handleFilterChange}
          onSelect={handleCategorySelect}
          userRole="client"
        />
      </div>

      {/* Swipe Deck — always shows cards, filtered by active category or ALL if none */}
      <div className="flex-1 relative overflow-hidden">
        <SwipessSwipeContainer
          onListingTap={() => {}}
          onInsights={() => {}}
          onMessageClick={onMessageClick}
        />
      </div>
    </div>
  );
}
