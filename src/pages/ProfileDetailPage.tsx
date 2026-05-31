import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { SimpleOwnerSwipeCard } from '@/components/SimpleOwnerSwipeCard';
import { triggerHaptic } from '@/utils/haptics';

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('client_profiles').select('*').eq('user_id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  if (!profile) return <div className="w-full h-screen flex flex-col items-center justify-center bg-background gap-4 p-6"><p className="text-muted-foreground">Profile not found</p><button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button></div>;

  return (
    <motion.div
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0.5, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16, mass: 0.6 }}
    >
      <div className="absolute inset-0">
        <SimpleOwnerSwipeCard
          profile={profile as any}
          onSwipe={() => {}}
          onSkip={() => {}}
          isTop={true}
          onTap={() => {}}
          onMessage={() => {
            triggerHaptic('light');
            navigate(`/messages/new?profile=${id}`);
          }}
          onShare={() => {
            triggerHaptic('light');
            const url = `${window.location.origin}/profile/${id}`;
            if (navigator.share) {
              navigator.share({ title: profile.name, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          onSoon={() => triggerHaptic('light')}
          onInsights={() => triggerHaptic('light')}
          onReport={() => triggerHaptic('light')}
          onSearch={() => {}}
        />
      </div>
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.4 }}
        onClick={() => navigate(-1)}
        className="absolute top-12 left-4 z-[60] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </motion.button>
    </motion.div>
  );
}
