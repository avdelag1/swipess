import { useState, useCallback, useMemo } from 'react';
import { UnifiedMarketplaceHub } from '@/components/UnifiedMarketplaceHub';
import { PropertyInsightsDialog } from '@/components/PropertyInsightsDialog';
import { NotificationBar } from '@/components/NotificationBar';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useFilterStore } from '@/state/filterStore';

interface ClientDashboardProps {
  onPropertyInsights?: (id: string) => void;
  onMessageClick?: (id?: string) => void;
}

/**
 * SPEED OF LIGHT: Unified Marketplace Dashboard
 * Swipess One Experience - One dashboard for everything
 */
export default function ClientDashboard({
  onPropertyInsights,
  onMessageClick,
}: ClientDashboardProps) {
  const { notifications, dismissNotification, markAllAsRead, handleNotificationClick } = useNotificationSystem();

  const handleInsights = useCallback((id: string) => {
    onPropertyInsights?.(id);
  }, [onPropertyInsights]);

  return (
    <>
      <NotificationBar
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAllRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
      />
      <UnifiedMarketplaceHub
        onInsights={handleInsights}
        onMessageClick={onMessageClick}
      />
    </>
  );
}

