
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
import { ClientInsightsDialog } from '@/components/ClientInsightsDialog';
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
              onMessageClick={() => {}}
              insightsOpen={showInsights}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Insights Dialog */}
      <ClientInsightsDialog
        open={showInsights}
        onOpenChange={(open) => {
          setShowInsights(open);
          if (!open) setSelectedClientId(null);
        }}
        profile={selectedProfile || null}
      />
    </>
  );
}

export default OwnerClientSwipeDialog;
