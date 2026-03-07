import { memo, useMemo } from 'react';
import { SwipessSwipeContainer } from './SwipessSwipeContainer';
import { ClientSwipeContainer } from './ClientSwipeContainer';
import { MarketplaceModeBar } from './MarketplaceModeBar';
import { useFilterStore } from '@/state/filterStore';

interface UnifiedMarketplaceHubProps {
    onInsights?: (id: string) => void;
    onMessageClick?: (id?: string) => void;
}

export const UnifiedMarketplaceHub = memo(({
    onInsights,
    onMessageClick
}: UnifiedMarketplaceHubProps) => {
    const marketplaceMode = useFilterStore((s) => s.marketplaceMode);
    const filterVersion = useFilterStore((s) => s.filterVersion);
    const getListingFilters = useFilterStore((s) => s.getListingFilters);
    const getQuickFilters = useFilterStore((s) => s.getQuickFilters);

    const listingFilters = useMemo(() => getListingFilters(), [filterVersion, getListingFilters]);
    const quickFilters = useMemo(() => getQuickFilters(), [filterVersion, getQuickFilters]);

    // Handle insights tap for either listings or clients
    const handleTap = (id: string) => {
        onInsights?.(id);
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Intent switcher tray - High-end Glass Transition */}
            <MarketplaceModeBar />

            <div className="flex-1 relative overflow-hidden">
                {marketplaceMode === 'discovery' ? (
                    <SwipessSwipeContainer
                        key="discovery-deck"
                        onListingTap={handleTap}
                        onInsights={handleTap}
                        onMessageClick={() => onMessageClick?.()}
                        filters={listingFilters as any}
                    />
                ) : (
                    <ClientSwipeContainer
                        key="incoming-deck"
                        onClientTap={handleTap}
                        onInsights={handleTap}
                        onMessageClick={(clientId) => onMessageClick?.(clientId)}
                        filters={quickFilters}
                    />
                )}
            </div>
        </div>
    );
});
