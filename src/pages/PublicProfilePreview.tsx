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
  Sparkles, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { STORAGE } from '@/constants/app';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';
import { SEO } from '@/components/SEO';
import { ShareDialog } from '@/components/ShareDialog';

export default function PublicProfilePreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, isDark } = useAppTheme();
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
        .select('user_id, full_name, city, avatar_url, bio, images, interests, nationality, languages_spoken, lifestyle_tags, age, gender, neighborhood, country')
        .eq('user_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleViewFullProfile = () => {
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
    setCurrentImageIndex(i => Math.max(0, i - 1));
    setImgLoaded(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(i => Math.min(allImages.length - 1, i + 1));
    setImgLoaded(false);
  }, [allImages.length]);

  // ── Loading State ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute top-0 left-0 right-0 h-16 bg-background/60 backdrop-blur-lg" />
        <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-2xl rounded-t-3xl border-t border-border/20 p-6 space-y-4">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error / Not Found ──────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This profile may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate('/')} size="lg" className="w-full rounded-2xl">
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
    <div className={cn(
      "fixed inset-0 overflow-hidden",
      isDark ? "bg-black" : "bg-white"
    )}>
      <SEO 
        title={`${profile.full_name || 'Anonymous'} — Discover on Swipess`}
        description={`${profile.bio || 'Elite discovery on Swipess.'} ${profile.city ? `Located in ${profile.city}.` : ''}`}
        image={allImages[0] || 'https://swipess.app/og-image-nexus.png'}
        url={`https://swipess.app/profile/${id}`}
        type="profile"
      />

      {/* ── BACKGROUND IMAGE ─────────────────────────────────────────── */}
      <div className="absolute inset-0">
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
              /* Gradient placeholder when no photo */
              <div className="w-full h-full bg-gradient-to-br from-pink-500/40 via-purple-500/30 to-orange-500/40 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <User className="w-16 h-16 text-white/50" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
      </div>

      {/* ── IMAGE TAP ZONES ───────────────────────────────────────────── */}
      {allImages.length > 1 && (
        <>
          <div
            className="absolute left-0 top-[15%] bottom-[50%] w-1/3 z-10 cursor-pointer"
            onClick={prevImage}
          />
          <div
            className="absolute right-0 top-[15%] bottom-[50%] w-1/3 z-10 cursor-pointer"
            onClick={nextImage}
          />
        </>
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
      >
        {canGoBack ? (
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.88 }}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        ) : (
          <div className="w-9" />
        )}

        {/* Profile identity pill removed for Swipess aesthetic */}
        <motion.button
          onClick={() => { triggerHaptic('light'); setShowShareDialog(true); }}
          whileTap={{ scale: 0.88 }}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg"
        >
          <Share2 className="w-4 h-4" />
        </motion.button>

        {!user ? (
          <motion.button
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.92 }}
            className="text-xs font-semibold text-white bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-lg"
          >
            Sign In
          </motion.button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* ── IMAGE DOTS ───────────────────────────────────────────────── */}
      {allImages.length > 1 && (
        <div
          className="absolute z-[60] left-0 right-0 flex justify-center gap-1.5"
          style={{ top: 'max(62px, calc(env(safe-area-inset-top, 0px) + 50px))' }}
        >
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentImageIndex(i); setImgLoaded(false); }}
              className={cn(
                'h-1 rounded-full transition-all duration-200',
                i === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
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
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
             "rounded-t-[28px] border-t shadow-[0_-20px_60px_rgba(0,0,0,0.4)] transition-all duration-500",
             "bg-background/92 backdrop-blur-2xl border-white/10"
          )}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border/60 rounded-full" />
          </div>

          <div className="px-5 pt-2 pb-5 space-y-4 max-h-[58vh] overflow-y-auto overscroll-contain">

            {/* Name, age, location */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {(profile as any).full_name || 'Anonymous'}
                  </h1>
                  {(profile as any).age && (
                    <span className="text-lg text-muted-foreground font-medium">
                      {(profile as any).age}
                    </span>
                  )}
                  {(profile as any).verified && (
                    <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/25 text-xs py-0 px-1.5">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {((profile as any).city || (profile as any).neighborhood) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {[(profile as any).neighborhood, (profile as any).city].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {(profile as any).nationality && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                      {(profile as any).nationality}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {(profile as any).bio && (
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                {(profile as any).bio}
              </p>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Interests
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {interests.slice(0, 6).map((interest, idx) => (
                    <Badge
                      key={idx}
                      className="bg-primary/10 text-primary border border-primary/20 text-xs rounded-full font-medium"
                    >
                      {interest}
                    </Badge>
                  ))}
                  {interests.length > 6 && (
                    <Badge variant="secondary" className="text-xs rounded-full">
                      +{interests.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {languages.map((lang, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs rounded-full border-border/50">
                    {lang}
                  </Badge>
                ))}
              </div>
            )}

            {/* Lock teaser for non-users */}
            {!user && (
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-2xl border border-border/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Create an account to view the full profile and connect.
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {!user ? (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-12 text-base shadow-lg shadow-primary/25"
                    onClick={() => navigate(`/?returnTo=/profile/${id}`)}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Free Account
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-2xl h-11 font-medium border-border/50"
                    onClick={() => navigate('/')}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold h-12 text-base shadow-lg shadow-primary/25"
                    onClick={handleViewFullProfile}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    View Full Profile
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-2xl h-11 font-medium border-border/50"
                    onClick={() => navigate('/client/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </>
              )}
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] italic opacity-20 pb-1">
              Swipess · Find Your Perfect Match
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


