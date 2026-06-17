import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { SimpleOwnerSwipeCard } from '@/components/SimpleOwnerSwipeCard';
import { triggerHaptic } from '@/utils/haptics';
import { Suspense, useMemo, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { ProfileCardSkeleton } from '@/components/ui/ContentSkeleton';
import { Button } from '@/components/ui/button';

const ReportDialog = lazyWithRetry(() => import('@/components/ReportDialog').then(m => ({ default: m.ReportDialog })));
const ShareDialog = lazyWithRetry(() => import('@/components/ShareDialog').then(m => ({ default: m.ShareDialog })));
const SwipeInsightsModal = lazyWithRetry(() => import('@/components/SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal })));

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('client_profiles').select('*').eq('user_id', id).maybeSingle();
      if (error) throw error;
      if (data) return data;
      // Fallback: owner who liked this client may only have an owner_profile
      const { data: ownerData } = await supabase.from('owner_profiles').select('*').eq('user_id', id).maybeSingle();
      if (!ownerData) return null;
      // Map owner_profiles fields to the shape SimpleOwnerSwipeCard expects
      return {
        user_id: ownerData.user_id,
        name: (ownerData as any).business_name || 'Property Owner',
        age: null,
        bio: (ownerData as any).business_description || '',
        profile_images: ownerData.profile_images || [],
        interests: [],
        city: (ownerData as any).business_location || '',
        verified: ownerData.verified_owner,
        budget_min: null,
        budget_max: null,
        work_schedule: null,
        gender: null,
      };
    },
    enabled: !!id,
  });

  const likedClientMock = useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.user_id,
      user_id: profile.user_id,
      full_name: profile.name,
      name: profile.name,
      age: profile.age,
      bio: profile.bio,
      profile_images: profile.profile_images || [],
      images: profile.profile_images || [],
      location: null,
      liked_at: new Date().toISOString(),
      occupation: (profile as any).occupation,
      nationality: (profile as any).nationality,
      interests: profile.interests,
      monthly_income: (profile as any).monthly_income,
      verified: profile.verified,
      gender: (profile as any).gender,
      city: profile.city
    } as any;
  }, [profile]);

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center bg-background p-6"><ProfileCardSkeleton /></div>;

  if (isError && !profile) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-background gap-4 p-6">
        <p className="text-sm font-semibold text-muted-foreground text-center">Could not load profile.</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  if (!profile) return <div className="w-full h-screen flex flex-col items-center justify-center bg-background gap-4 p-6"><p className="text-muted-foreground">Profile not found</p><button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button></div>;

  return (
    <motion.div
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0.5, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0">
        <SimpleOwnerSwipeCard
          profile={profile as any}
          disableDrag={true}
          onSwipe={() => {}}
          isTop={true}
          onTap={() => {}}
          onMessage={() => {
            triggerHaptic('light');
            navigate(`/messages?startConversation=${id}`);
          }}
          onShare={() => {
            triggerHaptic('light');
            setShowShare(true);
          }}
          onSoon={() => triggerHaptic('light')}
          onInsights={() => {
            triggerHaptic('light');
            setShowInsights(true);
          }}
          onReport={() => {
            triggerHaptic('light');
            setShowReport(true);
          }}
          onSearch={() => {}}
        />
      </div>
      {/* Back button is now handled by TopBar AppChrome */}
      
      {profile && (
        <>
          <Suspense fallback={null}><ReportDialog
            open={showReport}
            onOpenChange={setShowReport}
            reportedUserId={profile.user_id}
            reportedUserName={profile.name || 'User'}
            category="user_profile"
          /></Suspense>
          <Suspense fallback={null}><ShareDialog
            open={showShare}
            onOpenChange={setShowShare}
            profileId={profile.user_id}
            title={profile.name || 'Profile'}
            description={profile.bio || 'Check out this profile on Swipess'}
          /></Suspense>
          <Suspense fallback={null}><SwipeInsightsModal
            open={showInsights}
            onOpenChange={setShowInsights}
            profile={likedClientMock}
            onConnect={() => navigate(`/messages?startConversation=${id}`)}
            onReport={() => setShowReport(true)}
          /></Suspense>
        </>
      )}
    </motion.div>
  );
}
