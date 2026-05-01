
import { useState, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
// Lazy-load the 50kb LikedClientInsightsModal — only needed when insights panel opens
const LikedClientInsightsModal = lazy(() =>
  import('@/components/LikedClientInsightsModal').then(m => ({ default: m.LikedClientInsightsModal }))
);
import { useClientProfiles } from '@/hooks/useClientProfiles';

interface OwnerClientSwipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnerClientSwipeDialog({ open, onOpenChange }: OwnerClientSwipeDialogProps) {
  const [showInsights, setShowInsights] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { data: clientProfiles } = useClientProfiles();

  const handleInsights = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowInsights(true);
  };

  const handleClientTap = (clientId: string) => {
    // Open insights on tap
    handleInsights(clientId);
  };

  const selectedProfile = selectedClientId
    ? clientProfiles?.find(p => p.user_id === selectedClientId)
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Discover Potential Clients</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <ClientSwipeContainer
              onClientTap={handleClientTap}
              onInsights={handleInsights}
              onMessageClick={() => { }}
              insightsOpen={showInsights}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <LikedClientInsightsModal
          open={showInsights}
          onOpenChange={(open) => {
            setShowInsights(open);
            if (!open) setSelectedClientId(null);
          }}
          client={selectedProfile || null}
        />
      </Suspense>
    </>
  );
}

export default OwnerClientSwipeDialog;


