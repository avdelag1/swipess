import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { SimpleSwipeCard } from '@/components/SimpleSwipeCard';
import { triggerHaptic } from '@/utils/haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/hooks/useAuth';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing-detail', id],
    queryFn: async () => {
      if (!id) return null;
      let query = supabase.from('listings').select('*').eq('id', id).maybeSingle();
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  if (!listing) return <div className="w-full h-screen flex flex-col items-center justify-center bg-background gap-4 p-6"><p className="text-muted-foreground">Listing not found</p><button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button></div>;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        <SimpleSwipeCard
          listing={listing as any}
          onSwipe={() => {}}
          onSkip={() => {}}
          isTop={true}
          disableDrag={true}
          onCardTap={() => {}}
          onMessage={() => {
            triggerHaptic('light');
            navigate(`/messages/new?listing=${id}`);
          }}
          onShare={() => {
            triggerHaptic('light');
            const url = `${window.location.origin}/listing/${id}`;
            if (navigator.share) {
              navigator.share({ title: (listing as any).title, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          onSoon={() => {
            triggerHaptic('light');
          }}
          onInsights={() => {
            triggerHaptic('light');
          }}
          onReport={() => {
            triggerHaptic('light');
          }}
        />
      </div>
      <button
        onClick={() => navigate(-1)}
        className="absolute top-12 left-4 z-[60] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
