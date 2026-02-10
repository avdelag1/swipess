/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, memo } from 'react';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
import { ClientInsightsDialog } from '@/components/ClientInsightsDialog';
import { MatchCelebration } from '@/components/MatchCelebration';
import { NotificationBar } from '@/components/NotificationBar';
import { CategorySelectionDialog } from '@/components/CategorySelectionDialog';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useNavigate } from 'react-router-dom';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any; // Combined quick filters + advanced filters from DashboardLayout
}

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [matchCelebration, setMatchCelebration] = useState<{
    isOpen: boolean;
    clientProfile?: any;
    ownerProfile?: any;
  }>({ isOpen: false });

  const navigate = useNavigate();
  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();
  // FIX: Pass filters to query so fetched profiles match what container displays
  // Extract category from filters if available
  const filterCategory = filters?.categories?.[0] || filters?.category || undefined;
  const { data: clientProfiles = [], isLoading, error } = useSmartClientMatching(
    user?.id,
    filterCategory,
    0,      // page
    50,     // limit
    false,  // isRefreshMode
    filters // FIX: Now includes filters!
  );
  const { notifications, dismissNotification, markAllAsRead, handleNotificationClick } = useNotificationSystem();

  const handleClientTap = (clientId: string) => {
    setSelectedClientId(clientId);
    setInsightsOpen(true);
  };

  const handleInsights = (clientId: string) => {
    setSelectedClientId(clientId);
    setInsightsOpen(true);
    if (onClientInsights) {
      onClientInsights(clientId);
    }
  };

  const handleStartConversation = () => {
    navigate('/messages');
  };

  const handleCategorySelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'worker', mode: 'rent' | 'sale' | 'both') => {
    navigate(`/owner/properties#add-${category}`);
  };

  const selectedClient = clientProfiles.find(c => c.user_id === selectedClientId);

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
        insightsOpen={insightsOpen}
        filters={filters}
      />

      {selectedClient && (
        <ClientInsightsDialog
          open={insightsOpen}
          onOpenChange={setInsightsOpen}
          profile={selectedClient}
        />
      )}

      <MatchCelebration
        isOpen={matchCelebration.isOpen}
        onClose={() => setMatchCelebration({ isOpen: false })}
        matchedUser={{
          name: matchCelebration.clientProfile?.name || 'User',
          avatar: matchCelebration.clientProfile?.images?.[0],
          role: 'client'
        }}
        onMessage={handleStartConversation}
      />

      <CategorySelectionDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onCategorySelect={handleCategorySelect}
      />
    </>
  );
};

// Memoize to prevent re-renders from parent state changes
export default memo(EnhancedOwnerDashboard);