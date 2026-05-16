import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User, MapPin, ChevronLeft, Share2,
  ShieldCheck, UserPlus, LogIn, Sparkles, Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { STORAGE } from '@/constants/app';
import { SwipessLogo } from '@/components/SwipessLogo';
import { SEO } from '@/components/SEO';
import { ShareDialog } from '@/components/ShareDialog';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { PreviewSwipeCard } from '@/components/preview/PreviewSwipeCard';

export default function PublicProfilePreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && refCode.length > 0) {
      if (user?.id && user.id === refCode) return;
      localStorage.setItem(STORAGE.REFERRAL_CODE_KEY, JSON.stringify({
        code: refCode,
        capturedAt: Date.now(),
        source: `/profile/${id}`,
      }));
    }
  }, [searchParams, id, user?.id]);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      if (!id) throw new Error('No profile ID');
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, city, avatar_url, bio, images, interests, nationality, languages_spoken, age, gender, neighborhood, country, verified')
        .eq('user_id', id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <AtmosphericLayer variant="swipes" opacity={0.12} />
        <div className="w-16 h-16 rounded-full border-4 border-[#EB4898]/15 border-t-[#EB4898] animate-spin relative z-10" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
        <AtmosphericLayer variant="swipes" opacity={0.15} />
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 relative z-10">
          <User className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3 relative z-10">Profile Not Found</h1>
        <p className="text-white/50 text-sm max-w-xs mb-8 relative z-10">
          This profile is no longer available.
        </p>
        <Button
          onClick={() => { triggerHaptic('medium'); navigate('/'); }}
          className="h-14 px-10 rounded-2xl bg-white text-black font-bold relative z-10"
        >
          Go to Swipess
        </Button>
      </div>
    );
  }

  const images: string[] = (() => {
    const imgs = profile.images || [];
    const avatar = profile.avatar_url;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs;
    if (avatar) return [avatar];
    return [];
  })();

  const interests: string[] = profile.interests || [];
  const heroImage = images[0] || `${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/og-image-swipes.png`;

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

  return (
    <div className="fixed inset-0 w-full bg-black text-white flex flex-col overflow-hidden">
      <SEO
        title={`${profile.full_name || 'Profile'} on Swipess`}
        description={`${profile.bio || 'Discover on Swipess.'}${profile.city ? ` — ${profile.city}.` : ''}`}
        image={heroImage}
        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/profile/${id}`}
        type="profile"
      />

      <AtmosphericLayer variant="swipes" opacity={0.08} />

      <div
        className="relative z-50 flex items-center justify-between px-5 pb-3 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={() => { triggerHaptic('light'); window.history.length > 1 ? navigate(-1) : navigate('/'); }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <SwipessLogo size="sm" variant="transparent" className="opacity-90" />
        <button
          onClick={() => { triggerHaptic('light'); setShowShareDialog(true); }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
          aria-label="Share"
        >
          <Share2 className="w-4.5 h-4.5" />
        </button>
      </div>

      <div
        className="flex-1 min-h-0 px-4 flex flex-col gap-3 max-w-md mx-auto w-full"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 min-h-0"
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
              <div className="space-y-4">
                <div className="flex items-end gap-3 flex-wrap">
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-[1.05] text-white drop-shadow-lg line-clamp-2 break-words">
                    {profile.full_name || 'Anonymous'}
                  </h1>
                  {profile.age && (
                    <span className="text-2xl font-black text-white/70 tabular-nums leading-none pb-0.5">
                      {profile.age}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
                  {(profile.city || profile.neighborhood) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" />
                      {[profile.neighborhood, profile.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {profile.nationality && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#EB4898]" />
                      {profile.nationality}
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-xs text-white/80 leading-relaxed line-clamp-2">
                    {profile.bio}
                  </p>
                )}
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
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

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2 shrink-0"
        >
          {user ? (
            <Button
              onClick={handleViewFull}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#EB4898] to-[#FF4D00] text-white font-bold uppercase tracking-wider shadow-[0_10px_30px_rgba(235,72,152,0.35)] active:scale-[0.98] transition-transform"
            >
              <Sparkles className="w-5 h-5 mr-2.5" />
              See Full Insights
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCreateAccount}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#FF4D4D] to-[#E01E2A] text-white font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-transform shadow-[0_12px_36px_rgba(224,30,42,0.5)] border border-white/15"
              >
                <UserPlus className="w-5 h-5 mr-2.5" />
                Create Account
              </Button>
              <Button
                onClick={handleSignIn}
                className="w-full h-12 rounded-2xl bg-white hover:bg-white/95 text-black font-bold uppercase tracking-wider border border-white/30 active:scale-[0.98] transition-transform shadow-[0_12px_34px_rgba(255,255,255,0.18)]"
              >
                <LogIn className="w-5 h-5 mr-2.5" />
                Sign In
              </Button>
            </>
          )}
          <p className="text-center text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 pt-1">
            Powered by Swipess
          </p>
        </motion.div>
      </div>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        profileId={id}
        title={`${profile.full_name || 'Profile'} on Swipess`}
        description={`Discover ${profile.full_name || 'this profile'} on Swipess.`}
      />
    </div>
  );
}
