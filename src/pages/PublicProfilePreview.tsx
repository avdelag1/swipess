import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, ChevronLeft, Globe, LogIn, MapPin,
  Share2, ShieldCheck, Sparkles, User, UserPlus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { STORAGE } from '@/constants/app';
import { SwipessLogo } from '@/components/SwipessLogo';
import { SEO } from '@/components/SEO';
import { ImmersiveDarkShell } from '@/components/ui/AmbientPageBackground';
import { PreviewSwipeCard } from '@/components/preview/PreviewSwipeCard';

const ShareDialog = lazyWithRetry(() => import('@/components/ShareDialog').then(m => ({ default: m.ShareDialog })));

export default function PublicProfilePreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const refCode = searchParams.get('ref');
  const isGuest = !user;

  useEffect(() => {
    if (refCode && refCode.length > 0) {
      if (user?.id && user.id === refCode) return;
      localStorage.setItem(STORAGE.REFERRAL_CODE_KEY, JSON.stringify({
        code: refCode,
        capturedAt: Date.now(),
        source: `/profile/${id}`,
      }));
    }
  }, [refCode, id, user?.id]);

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      if (!id) throw new Error('No profile ID');
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, city, avatar_url, bio, images, interests, nationality, languages_spoken, age, gender, neighborhood, country, verified')
        .eq('user_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const images: string[] = useMemo(() => {
    if (!profile) return [];
    const imgs = profile.images || [];
    const avatar = profile.avatar_url;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs as string[];
    if (avatar) return [avatar];
    return [];
  }, [profile]);

  const interests: string[] = useMemo(
    () => (Array.isArray(profile?.interests) ? profile.interests : []) as string[],
    [profile?.interests],
  );

  const heroImage = images[0] || `${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/og-image-Swipes.png`;
  const locationLabel = [profile?.neighborhood, profile?.city].filter(Boolean).join(', ') || profile?.country || 'Location on request';

  const handleCreateAccount = () => {
    triggerHaptic('success');
    navigate(`/?returnTo=/profile/${id}&intent=signup`);
  };

  const handleSignIn = () => {
    triggerHaptic('medium');
    navigate(`/?returnTo=/profile/${id}&intent=signin`);
  };

  const handleViewFull = () => {
    triggerHaptic('medium');
    navigate(`/owner/view-client/${id}`);
  };

  if (isLoading) {
    return (
      <ImmersiveDarkShell className="fixed inset-0 bg-[#07070d] flex flex-col p-6 pt-safe z-10">
        <div className="relative z-10 max-w-md mx-auto w-full mt-8">
          <div className="aspect-[3/4] rounded-[2rem] bg-white/5 border border-white/10 animate-pulse mb-4" />
          <div className="h-6 bg-white/5 rounded-xl w-3/4 animate-pulse mb-2" />
          <div className="h-4 bg-white/5 rounded-lg w-1/2 animate-pulse" />
        </div>
      </ImmersiveDarkShell>
    );
  }

  if (isError && !profile) {
    return (
      <ImmersiveDarkShell className="fixed inset-0 bg-[#07070d] flex flex-col items-center justify-center p-8 text-center gap-4">
        <p className="text-sm font-semibold text-white/50 relative z-10">Could not load profile.</p>
        <Button onClick={() => refetch()} className="relative z-10 rounded-2xl">Try again</Button>
      </ImmersiveDarkShell>
    );
  }

  if (!profile) {
    return (
      <ImmersiveDarkShell className="fixed inset-0 bg-[#07070d] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 relative z-10">
          <User className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3 relative z-10">Profile Not Found</h1>
        <p className="text-white/50 text-sm max-w-xs mb-8 relative z-10">
          This profile is no longer available or the link may have expired.
        </p>
        <Button
          onClick={() => { triggerHaptic('medium'); navigate('/'); }}
          className="h-14 px-10 rounded-2xl bg-white text-black font-bold relative z-10"
        >
          Explore Swipess
        </Button>
      </ImmersiveDarkShell>
    );
  }

  const seoDescription = `${profile.bio || 'Discover on Swipess.'}${profile.city ? ` — ${profile.city}.` : ''}`;

  return (
    <ImmersiveDarkShell className="fixed inset-0 w-full bg-[#07070d] text-white flex flex-col overflow-hidden">
      <SEO
        title={`${profile.full_name || 'Profile'} on Swipess`}
        description={seoDescription}
        image={heroImage}
        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/profile/${id}`}
        type="profile"
      />

      <div
        className="relative z-50 flex items-center justify-between px-4 pb-2 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
      >
        <button
          onClick={() => { triggerHaptic('light'); if (window.history.length > 1) navigate(-1); else navigate('/'); }}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <SwipessLogo size="sm" variant="transparent" className="opacity-90" />
        <button
          onClick={() => { triggerHaptic('light'); setShowShareDialog(true); }}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-40 mx-4 mb-2 shrink-0"
        >
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#6366F1]/15 via-black/40 to-[#EB4898]/15 backdrop-blur-xl px-4 py-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6366F1]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#A5B4FC]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-white">
                {refCode ? 'Someone shared this profile with you' : 'Shared profile preview'}
              </p>
              <p className="text-[10px] text-white/55 mt-0.5 leading-relaxed">
                Join Swipess to connect, message, and discover people and listings near you.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div
        className="flex-1 min-h-0 flex flex-col gap-3 max-w-md mx-auto w-full px-4 overflow-y-auto no-scrollbar"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0"
          style={{ minHeight: 'min(52vh, 420px)' }}
        >
          <PreviewSwipeCard
            fill
            images={images}
            fallback={<User className="w-20 h-20 text-white/15" />}
            badges={
              profile.verified ? (
                <Badge className="bg-[#EB4898]/20 backdrop-blur-xl text-[#EB4898] border border-[#EB4898]/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Verified
                </Badge>
              ) : null
            }
            overlay={
              <div className="space-y-3">
                <div className="flex items-end gap-3 flex-wrap">
                  <h1 className="text-[1.65rem] font-black uppercase tracking-tight leading-[1.05] text-white drop-shadow-lg line-clamp-2 break-words">
                    {profile.full_name || 'Anonymous'}
                  </h1>
                  {profile.age != null && (
                    <span className="text-xl font-black text-white/70 tabular-nums leading-none pb-0.5">
                      {profile.age}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold uppercase tracking-wider text-white/75">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" />
                    {locationLabel}
                  </span>
                  {profile.nationality && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#EB4898]" />
                      {profile.nationality}
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-xs text-white/80 leading-relaxed line-clamp-3">{profile.bio}</p>
                )}
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {interests.slice(0, 5).map((it, i) => (
                      <Badge
                        key={i}
                        className="bg-white/10 backdrop-blur-xl text-white/90 border border-white/15 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      >
                        {it}
                      </Badge>
                    ))}
                    {interests.length > 5 && (
                      <Badge className="bg-white/5 text-white/50 border border-white/10 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                        +{interests.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 shrink-0"
        >
          <div className="flex flex-wrap gap-2">
            {profile.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                Verified member
              </span>
            )}
            {refCode && isGuest && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A5B4FC]">
                Referral applied
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14 }}
          className="sticky bottom-0 z-30 shrink-0 pt-1"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}
        >
          <div className="rounded-[1.75rem] border border-white/12 bg-[#0d0d14]/90 backdrop-blur-2xl p-3 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] space-y-2">
            {user ? (
              <Button
                onClick={handleViewFull}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#EB4898] to-[#FF4D00] text-white font-bold uppercase tracking-wider shadow-[0_10px_30px_rgba(235,72,152,0.35)] active:scale-[0.98] transition-transform"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                See Full Insights
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCreateAccount}
                  className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#FF4D4D] to-[#E01E2A] text-white font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-transform shadow-[0_12px_36px_rgba(224,30,42,0.45)] border border-white/15"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Join Free to Connect
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleSignIn}
                    variant="outline"
                    className="h-11 rounded-xl bg-white/5 border-white/15 text-white font-bold uppercase tracking-wider text-[10px] hover:bg-white/10 active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Sign In
                  </Button>
                  <Button
                    onClick={() => { triggerHaptic('light'); navigate('/'); }}
                    variant="outline"
                    className="h-11 rounded-xl bg-white/5 border-white/15 text-white/80 font-bold uppercase tracking-wider text-[10px] hover:bg-white/10 active:scale-[0.98]"
                  >
                    <ArrowRight className="w-4 h-4 mr-1.5" />
                    Explore App
                  </Button>
                </div>
              </>
            )}
            <p className="text-center text-[9px] font-bold uppercase tracking-[0.28em] text-white/25 pt-0.5">
              Swipess · Elite marketplace
            </p>
          </div>
        </motion.div>
      </div>

      <Suspense fallback={null}>
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          profileId={id}
          title={`${profile.full_name || 'Profile'} on Swipess`}
          description={`Discover ${profile.full_name || 'this profile'} on Swipess.`}
        />
      </Suspense>
    </ImmersiveDarkShell>
  );
}