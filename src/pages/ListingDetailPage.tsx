import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { SimpleSwipeCard } from '@/components/SimpleSwipeCard';
import { triggerHaptic } from '@/utils/haptics';
import { useState } from 'react';
import { ReportDialog } from '@/components/ReportDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { SwipeInsightsModal } from '@/components/SwipeInsightsModal';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const query = supabase.from('listings').select('*').eq('id', id).maybeSingle();
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  if (!listing) return <div className="w-full h-screen flex flex-col items-center justify-center bg-background gap-4 p-6"><p className="text-muted-foreground">Listing not found</p><button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button></div>;

  const l = listing as any;

  return (
    <motion.div
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0.5, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16, mass: 0.6 }}
    >
      <div className="absolute inset-0">
        <SimpleSwipeCard
          listing={listing as any}
          onSwipe={() => {}}
          onSkip={() => {}}
          isTop={true}
          disableDrag={true}
          onCardTap={() => setShowInsights(true)}
          onMessage={() => {
            triggerHaptic('light');
            navigate(`/messages/new?listing=${id}`);
          }}
          onShare={() => {
            triggerHaptic('light');
            setShowShare(true);
          }}
          onSoon={() => {
            triggerHaptic('light');
          }}
          onInsights={() => {
            triggerHaptic('light');
            setShowInsights(true);
          }}
          onReport={() => {
            triggerHaptic('light');
            setShowReport(true);
          }}
        />
      </div>

      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reportedListingId={l.id}
        reportedListingTitle={l.title || 'Listing'}
        reportedUserId={l.owner_id || l.user_id}
        reportedUserAge={l.owner_age}
        category="listing"
      />
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        listingId={l.id}
        title={l.title || 'Check out this listing'}
        description={l.description}
        previewImage={(Array.isArray(l.images) && l.images[0]) || l.image_url || null}
      />
      <SwipeInsightsModal
        open={showInsights}
        onOpenChange={setShowInsights}
        listing={listing as any}
      />
    </motion.div>
  );
}
