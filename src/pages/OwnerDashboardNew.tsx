// @ts-nocheck
/** SPEED OF LIGHT: Owner Dashboard - Tinder-Style Client Swipe Cards */
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
import { ClientInsightsDialog } from '@/components/ClientInsightsDialog';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '@/state/filterStore';

export default function OwnerDashboardNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const activeCategory = useFilterStore((s) => s.activeCategory);

  // PERFORMANCE: Only fetch the selected client profile when dialog opens
  const { data: clientProfiles } = useClientProfiles();

  const handleClientTap = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setInsightsOpen(true);
  }, []);

  const handleInsights = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setInsightsOpen(true);
  }, []);

  const handleMessageClick = useCallback((clientId: string) => {
    navigate(`/messages?userId=${clientId}`);
  }, [navigate]);

  const selectedProfile = selectedClientId
    ? clientProfiles?.find(p => p.user_id === selectedClientId)
    : null;

  return (
    <>
      {/* Full-screen Tinder-style swipe interface */}
      <ClientSwipeContainer
        onClientTap={handleClientTap}
        onInsights={handleInsights}
        onMessageClick={handleMessageClick}
        insightsOpen={insightsOpen}
        category={activeCategory || 'default'}
      />

      {/* Client Insights Dialog */}
      <ClientInsightsDialog
        open={insightsOpen}
        onOpenChange={(open) => {
          setInsightsOpen(open);
          if (!open) setSelectedClientId(null);
        }}
        profile={selectedProfile || null}
      />
    </>
  );
}
