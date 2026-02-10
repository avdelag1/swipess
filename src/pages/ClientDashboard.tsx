import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TinderentSwipeContainer } from '@/components/TinderentSwipeContainer';
import { PropertyInsightsDialog } from '@/components/PropertyInsightsDialog';
import { supabase } from '@/integrations/supabase/client';
import { ListingFilters } from '@/hooks/useSmartMatching';
import { Listing } from '@/hooks/useListings';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
  filters?: ListingFilters;
}

/**
 * SPEED OF LIGHT: Client Dashboard
 * DashboardLayout is now rendered ONCE at route level via PersistentDashboardLayout
 * This component only renders its inner content
 */
export default function ClientDashboard({ 
  onPropertyInsights, 
  onMessageClick, 
  filters 
}: ClientDashboardProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

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
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const handleListingTap = useCallback((listingId: string) => {
    setSelectedListingId(listingId);
    setInsightsOpen(true);
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  return (
    <>
      <TinderentSwipeContainer
        onListingTap={handleListingTap}
        onInsights={handleListingTap}
        onMessageClick={onMessageClick}
        filters={filters}
      />

      <PropertyInsightsDialog
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        listing={selectedListing ?? null}
      />
    </>
  );
}
