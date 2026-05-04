import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, MapPin, Lock, LogIn, UserPlus, ArrowLeft,
  Sparkles, Globe, Zap, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { STORAGE } from '@/constants/app';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';
import { SEO } from '@/components/SEO';
import { ShareDialog } from '@/components/ShareDialog';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';

export default function PublicProfilePreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useAppTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  // Capture referral code
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
        .select('user_id, full_name, city, avatar_url, bio, images, interests, nationality, languages_spoken, lifestyle_tags, age, gender, neighborhood, country, verified')
        .eq('user_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleViewFullProfile = () => {
    triggerHaptic('medium');
    if (user) {
      navigate(`/owner/view-client/${id}`);
    } else {
      navigate(`/?returnTo=/profile/${id}`);
    }
  };

  const allImages: string[] = (() => {
    if (!profile) return [];
    const imgs = (profile as any).images || (profile as any).profile_images || [];
    const avatar = (profile as any).avatar_url;
    if (imgs.length > 0) return imgs;
    if (avatar) return [avatar];
    return [];
  })();

  const prevImage = useCallback(() => {
    triggerHaptic('light');
    setCurrentImageIndex(i => Math.max(0, i - 1));
    setImgLoaded(false);
  }, []);

  const nextImage = useCallback(() => {
    triggerHaptic('light');
    setCurrentImageIndex(i => Math.min(allImages.length - 1, i + 1));
    setImgLoaded(false);
  }, [allImages.length]);

  // ── Loading State ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#020202]">
        <Skeleton className="absolute inset-0 rounded-none bg-white/[0.02]" />
        <div className="absolute top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-lg" />
        <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-3xl rounded-t-[40px] border-t border-white/5 p-8 space-y-6">
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-6">
            <Skeleton className="w-20 h-20 rounded-[32px] bg-white/[0.05]" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-3/4 bg-white/[0.05]" />
              <Skeleton className="h-5 w-1/2 bg-white/[0.05]" />
            </div>
          </div>
          <Skeleton className="h-24 rounded-[32px] bg-white/[0.05]" />
          <div className="flex flex-wrap gap-2.5">
            <Skeleton className="h-8 w-24 rounded-full bg-white/[0.05]" />
            <Skeleton className="h-8 w-28 rounded-full bg-white/[0.05]" />
            <Skeleton className="h-8 w-20 rounded-full bg-white/[0.05]" />
          </div>
          <Skeleton className="h-16 rounded-[24px] bg-white/[0.05]" />
        </div>
      </div>
    );
  }

  // ── Error / Not Found ──────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="fixed inset-0 bg-[#020202] flex flex-col items-center justify-center p-8">
        <AtmosphericLayer variant="nexus" opacity={0.15} />
        <div className="text-center max-w-sm relative z-10">
          <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/10 backdrop-blur-xl">
            <User className="w-12 h-12 text-white/20" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-3 italic">Profile Lost</h1>
          <p className="text-white/40 mb-10 uppercase tracking-widest text-[11px] font-bold leading-relaxed">
            This sector is currently unreachable. The profile may have been encrypted or removed.
          </p>
          <Button 
            onClick={() => { triggerHaptic('medium'); navigate('/'); }} 
            size="lg" 
            className="w-full rounded-[24px] bg-white text-black font-black uppercase tracking-widest h-16 hover:bg-white/90 active:scale-95 transition-all"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = allImages.length > 0 ? allImages[currentImageIndex] : null;
  const interests: string[] = (profile as any).interests || [];
  const languages: string[] = (profile as any).languages_spoken || [];

  // ── Main Render ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#020202] text-white">
      <SEO 
        title={`${profile.full_name || 'Anonymous'} — Discover on Swipess`}
        description={`${profile.bio || 'Elite discovery on Swipess.'} ${profile.city ? `Located in ${profile.city}.` : ''}`}
        image={allImages[0] || 'https://swipess.app/og-image-nexus.png'}
        url={`https://swipess.app/profile/${id}`}
        type="profile"
      />

      <AtmosphericLayer variant="nexus" opacity={0.12} />

      {/* ── BACKGROUND IMAGE ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={(profile as any).full_name || 'Profile'}
                className="w-full h-full object-cover object-top"
                onLoad={() => setImgLoaded(true)}
                style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.25s' }}
              />
            ) : (
              /* Nexus Gradient placeholder when no photo */
              <div className="w-full h-full bg-gradient-to-br from-[#FF4D00]/20 via-black to-[#EB4898]/20 flex items-center justify-center">
                <div className="w-32 h-32 rounded-[40px] bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center shadow-2xl">
                  <User className="w-16 h-16 text-white/10" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent pointer-events-none" />
      </div>

      {/* ── IMAGE TAP ZONES ───────────────────────────────────────────── */}
      {allImages.length > 1 && (
        <>
          <div
            className="absolute left-0 top-[15%] bottom-[40%] w-1/3 z-20 cursor-pointer"
            onClick={prevImage}
          />
          <div
            className="absolute right-0 top-[15%] bottom-[40%] w-1/3 z-20 cursor-pointer"
            onClick={nextImage}
          />
        </>
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 py-4"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}
      >
        <div className="flex items-center gap-3">
          {canGoBack && (
            <motion.button
              onClick={() => { triggerHaptic('light'); navigate(-1); }}
              whileTap={{ scale: 0.88 }}
              className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white shadow-2xl transition-all hover:bg-black/60"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
          <div className="px-4 py-2 rounded-2xl bg-[#EB4898]/10 border border-[#EB4898]/20 backdrop-blur-2xl flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#EB4898] fill-current animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] italic">Live Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => { triggerHaptic('light'); setShowShareDialog(true); }}
            whileTap={{ scale: 0.88 }}
            className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white shadow-2xl transition-all hover:bg-black/60"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>

          {!user && (
            <motion.button
              onClick={() => { triggerHaptic('medium'); navigate('/'); }}
              whileTap={{ scale: 0.92 }}
              className="text-[10px] font-black uppercase tracking-widest text-white bg-white/10 backdrop-blur-2xl border border-white/20 px-5 py-2.5 rounded-2xl shadow-2xl hover:bg-white/20 transition-all"
            >
              Sign In
            </motion.button>
          )}
        </div>
      </div>

      {/* ── IMAGE DOTS ───────────────────────────────────────────────── */}
      {allImages.length > 1 && (
        <div
          className="absolute z-[60] left-0 right-0 flex justify-center gap-1.5"
          style={{ top: 'max(76px, calc(env(safe-area-inset-top, 0px) + 60px))' }}
        >
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => { triggerHaptic('light'); setCurrentImageIndex(i); setImgLoaded(false); }}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === currentImageIndex ? 'w-8 bg-[#EB4898]' : 'w-2 bg-white/30'
              )}
            />
          ))}
        </div>
      )}

      {/* ── BOTTOM CONTENT SHEET ─────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[60]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
             "rounded-t-[48px] border-t shadow-[0_-30px_80px_rgba(0,0,0,0.8)] transition-all duration-700 relative overflow-hidden",
             "bg-[#0A0A0A]/95 backdrop-blur-3xl border-white/[0.08]"
          )}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#EB4898]/5 rounded-full blur-[100px] -translate-y-32 translate-x-32" />
          
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2 relative z-10">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-8 space-y-6 max-h-[62vh] overflow-y-auto overscroll-contain relative z-10 custom-scrollbar">

            {/* Name, age, location */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                    {(profile as any).full_name || 'Anonymous'}
                  </h1>
                  {(profile as any).age && (
                    <span className="text-2xl text-white/40 font-black italic tabular-nums leading-none">
                      {(profile as any).age}
                    </span>
                  )}
                  {profile.verified && (
                    <div className="px-2.5 py-1 rounded-lg bg-[#EB4898]/10 border border-[#EB4898]/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(235,72,152,0.1)]">
                       <ShieldCheck className="w-3.5 h-3.5 text-[#EB4898]" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] italic">Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] italic">
                  {((profile as any).city || (profile as any).neighborhood) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#FF4D00]" />
                      {[(profile as any).neighborhood, (profile as any).city].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {(profile as any).nationality && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#EB4898]" />
                      {(profile as any).nationality}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {(profile as any).bio && (
              <div className="p-5 rounded-[32px] bg-white/[0.03] border border-white/[0.05] shadow-inner">
                <p className="text-sm text-white/70 leading-relaxed italic">
                  {(profile as any).bio}
                </p>
              </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic ml-1">
                  Interests
                </p>
                <div className="flex flex-wrap gap-2">
                  {interests.slice(0, 8).map((interest, idx) => (
                    <Badge
                      key={idx}
                      className="bg-[#EB4898]/10 text-[#EB4898] border border-[#EB4898]/20 text-[10px] rounded-xl font-black uppercase tracking-widest px-3 py-1.5 italic"
                    >
                      {interest}
                    </Badge>
                  ))}
                  {interests.length > 8 && (
                    <Badge variant="secondary" className="bg-white/5 text-white/40 border-none text-[10px] rounded-xl font-black uppercase tracking-widest px-3 py-1.5 italic">
                      +{interests.length - 8} More
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Lock teaser for non-users */}
            {!user && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-5 bg-gradient-to-r from-[#FF4D00]/10 to-transparent rounded-[32px] border border-[#FF4D00]/20 backdrop-blur-xl shadow-2xl"
              >
                <div className="w-12 h-12 rounded-[20px] bg-[#FF4D00] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(255,77,0,0.4)]">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-white/60 leading-relaxed italic">
                  Complete your Nexus identity to unlock full metadata and direct sync.
                </p>
              </motion.div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              {!user ? (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-[24px] bg-gradient-to-r from-[#FF4D00] to-[#EB4898] hover:opacity-90 text-white font-black h-16 text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,77,0,0.3)] active:scale-[0.98] transition-all"
                    onClick={() => { triggerHaptic('success'); navigate(`/?returnTo=/profile/${id}`); }}
                  >
                    <UserPlus className="w-5 h-5 mr-3" />
                    Initialize Identity
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-[24px] h-14 font-black uppercase tracking-widest text-[11px] border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all italic"
                    onClick={() => { triggerHaptic('medium'); navigate('/'); }}
                  >
                    <LogIn className="w-4 h-4 mr-3" />
                    Authorized Login
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-[24px] bg-gradient-to-r from-[#FF4D00] to-[#EB4898] hover:opacity-90 text-white font-black h-16 text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,77,0,0.3)] active:scale-[0.98] transition-all"
                    onClick={handleViewFullProfile}
                  >
                    <Sparkles className="w-5 h-5 mr-3" />
                    Sync Full Profile
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-[24px] h-14 font-black uppercase tracking-widest text-[11px] border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all italic"
                    onClick={() => { triggerHaptic('medium'); navigate('/client/dashboard'); }}
                  >
                    Back to Nexus
                  </Button>
                </>
              )}
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] italic opacity-20 pb-2">
              Nexus Protocol · Discovery Standard 2.0
            </p>
          </div>
        </motion.div>
      </div>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        profileId={id}
        title={profile.full_name || 'Anonymous User'}
        description={`✨ Discover ${profile.full_name || 'this user'} on Swipess. Immersive discovery for properties, vehicles, and connections.`}
      />
    </div>
  );
}


