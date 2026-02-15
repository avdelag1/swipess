// @ts-nocheck
/** SPEED OF LIGHT: Client Dashboard */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TinderentSwipeContainer } from '@/components/TinderentSwipeContainer';
import { PropertyInsightsDialog } from '@/components/PropertyInsightsDialog';
import { LegalAIButton } from '@/components/LegalAIAssistant';
import { supabase } from '@/integrations/supabase/client';
import { ListingFilters } from '@/hooks/useSmartMatching';
import { useFilterStore } from '@/state/filterStore';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
  filters?: ListingFilters;
}

export default function ClientDashboard({  
  onPropertyInsights, 
  onMessageClick, 
  filters 
}: ClientDashboardProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  
  // Connect filter store to swipe container
  const filterVersion = useFilterStore((s) => s.filterVersion);
  const getListingFilters = useFilterStore((s) => s.getListingFilters);
  const storeFilters = useMemo(() => getListingFilters(), [filterVersion, getListingFilters]);
  const mergedFilters = useMemo(() => ({ ...filters, ...storeFilters }), [filters, storeFilters]);

  // PERFORMANCE: Only fetch the selected listing when dialog opens
  const { data: selectedListing } = useQuery({
    queryKey: ['listing-detail', selectedListingId],
    queryFn: async () => {
      if (!selectedListingId) return null;
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', selectedListingId)
        .single();
      if (error) throw error;
      return data as Listing;
    },
    enabled: !!selectedListingId && insightsOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const handleListingTap = useCallback((listingId: string) => {
    setSelectedListingId(listingId);
    setInsightsOpen(true);
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  return (
    <>
      {/* Full-screen Tinder-style swipe interface */}
      <TinderentSwipeContainer
        onListingTap={handleListingTap}
        onInsights={handleListingTap}
        onMessageClick={onMessageClick}
        insightsOpen={insightsOpen}
        filters={mergedFilters}
      />

      {/* Property Insights Dialog */}
      <PropertyInsightsDialog
        open={insightsOpen}
        onOpenChange={(open) => {
          setInsightsOpen(open);
          if (!open) setSelectedListingId(null);
        }}
        listing={selectedListing || null}
      />

      {/* Legal AI Button - Fixed at bottom right */}
      <div className="fixed bottom-24 right-4 z-50">
        <LegalAIButton context={{ userRole: 'client' }} />
      </div>
    </>
  );
}
