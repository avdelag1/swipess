
import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
// Lazy-load the 50kb SwipeInsightsModal — only needed when insights panel opens
const SwipeInsightsModal = lazy(() =>
  import('@/components/SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal }))
);
import { useClientProfiles } from '@/hooks/useClientProfiles';

interface OwnerClientSwipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnerClientSwipeDialog({ open, onOpenChange }: OwnerClientSwipeDialogProps) {
  const navigate = useNavigate();
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

  const selectedProfileRaw = selectedClientId
    ? clientProfiles?.find(p => p.user_id === selectedClientId)
    : null;

  const selectedProfile = selectedProfileRaw
    ? {
        id: String(selectedProfileRaw.id ?? selectedProfileRaw.user_id),
        user_id: selectedProfileRaw.user_id,
        full_name: selectedProfileRaw.name || '',
        name: selectedProfileRaw.name || '',
        age: selectedProfileRaw.age || 0,
        bio: '',
        profile_images: selectedProfileRaw.profile_images || [],
        images: selectedProfileRaw.profile_images || [],
        location: selectedProfileRaw.location,
        liked_at: new Date().toISOString(),
        gender: selectedProfileRaw.gender,
        city: selectedProfileRaw.city,
        interests: selectedProfileRaw.interests,
        verified: selectedProfileRaw.verified,
        preferred_activities: [],
        lifestyle_tags: (selectedProfileRaw as any).lifestyle_tags || [],
        matchPercentage: 0,
        matchReasons: [],
        incompatibleReasons: [],
      } as any
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
              onMessageClick={(clientId) => {
                onOpenChange(false);
                navigate(`/messages?startConversation=${clientId}`);
              }}
              insightsOpen={showInsights}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <SwipeInsightsModal
          open={showInsights}
          onOpenChange={(open) => {
            setShowInsights(open);
            if (!open) setSelectedClientId(null);
          }}
          profile={selectedProfile || null}
        />
      </Suspense>
    </>
  );
}

export default OwnerClientSwipeDialog;


