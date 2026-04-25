import { useMemo } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore } from '@/state/filterStore';
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

  const filterVersion = useFilterStore(s => s.filterVersion);
  const filters = useMemo(
    () => useFilterStore.getState().getListingFilters(),
    [filterVersion]
  );

  // Pre-fetch listing data so the swipe deck is ready instantly
  useSmartListingMatching(user?.id, [], filters, 0, 20, false);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col overflow-hidden relative w-full h-full",
        isLight ? "bg-white" : "bg-[#020202]"
      )}
      style={{
        paddingTop: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 0px))',
        paddingBottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px))',
      }}
    >
      <SwipessSwipeContainer
        onListingTap={() => {}}
        onInsights={() => {}}
        onMessageClick={onMessageClick}
      />
    </div>
  );
}
