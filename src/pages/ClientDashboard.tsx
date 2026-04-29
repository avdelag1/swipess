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
        "flex-1 flex flex-col relative w-full min-h-0",
        isLight ? "bg-white" : "bg-[#020202]"
      )}
      style={{
        willChange: 'transform',
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
