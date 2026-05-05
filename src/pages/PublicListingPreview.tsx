import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DirectMessageDialog } from '@/components/DirectMessageDialog';
import {
  Home, MapPin, Bed, Bath, Square,
  Anchor, Bike, MessageCircle,
  ChevronLeft, Share2, UserPlus, LogIn,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { STORAGE } from '@/constants/app';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';
import { triggerHaptic } from '@/utils/haptics';
import { SEO } from '@/components/SEO';
import { ShareDialog } from '@/components/ShareDialog';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { PreviewSwipeCard } from '@/components/preview/PreviewSwipeCard';

export default function PublicListingPreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Capture referral code
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && refCode.length > 0) {
      if (user?.id && user.id === refCode) return;
      localStorage.setItem(STORAGE.REFERRAL_CODE_KEY, JSON.stringify({
        code: refCode,
        capturedAt: Date.now(),
        source: `/listing/${id}`,
      }));
    }
  }, [searchParams, id, user?.id]);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['public-listing', id],
    queryFn: async () => {
      if (!id) throw new Error('No listing ID');
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'yacht': return <Anchor className="w-3.5 h-3.5" />;
      case 'motorcycle': return <MotorcycleIcon className="w-3.5 h-3.5" />;
      case 'bicycle': return <Bike className="w-3.5 h-3.5" />;
      default: return <Home className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'motorcycle': return 'Vespa/Moto';
      case 'bicycle': return 'Beach Cruiser';
      case 'yacht': return 'Yacht';
      default: return 'Property';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <AtmosphericLayer variant="nexus" opacity={0.12} />
        <div className="w-16 h-16 rounded-full border-4 border-[#EB4898]/15 border-t-[#EB4898] animate-spin relative z-10" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
        <AtmosphericLayer variant="nexus" opacity={0.15} />
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 relative z-10">
          <Home className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3 relative z-10">Listing Not Found</h1>
        <p className="text-white/50 text-sm max-w-xs mb-8 relative z-10">
          This listing is no longer available.
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

  const category = listing.category || 'property';
  const mode = (listing as any).listing_type || 'rent';
  const images = (Array.isArray(listing.images) ? listing.images : []) as string[];
  const heroImage = images[0] || `${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/og-image-nexus.png`;

  const handleCreateAccount = () => {
    triggerHaptic('success');
    navigate(`/?returnTo=/listing/${id}&intent=signup`);
  };
  const handleSignIn = () => {
    triggerHaptic('medium');
    navigate(`/?returnTo=/listing/${id}&intent=signin`);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white relative overflow-x-hidden">
      <SEO
        title={listing.title || 'Swipess Listing'}
        description={`${listing.beds || 0} Beds · ${listing.baths || 0} Baths · ${listing.city || 'Tulum'} — $${listing.price?.toLocaleString() || '—'}`}
        image={heroImage}
        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/listing/${id}`}
        type="website"
      />

      <AtmosphericLayer variant="nexus" opacity={0.08} />

      {/* Top minimal nav */}
      <div
        className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
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
        className="px-4 pb-10 flex flex-col gap-6 max-w-md mx-auto"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)' }}
      >
        {/* Hero swipe card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <PreviewSwipeCard
            images={images}
            fallback={<SwipessLogo size="lg" variant="transparent" className="opacity-30" />}
            badges={
              <>
                <Badge className="bg-black/50 backdrop-blur-xl text-white border border-white/15 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  {getCategoryIcon(category)}
                  <span className="ml-1.5">{getCategoryLabel(category)}</span>
                </Badge>
                <Badge className={cn(
                  'backdrop-blur-xl border text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full',
                  mode === 'sale'
                    ? 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/30'
                    : 'bg-[#EB4898]/20 text-[#EB4898] border-[#EB4898]/30'
                )}>
                  {mode === 'sale' ? 'For Sale' : 'For Rent'}
                </Badge>
              </>
            }
            overlay={
              <div className="space-y-4">
                <h1 className="text-3xl font-black uppercase tracking-tight leading-[1.05] text-white drop-shadow-lg line-clamp-2 break-words">
                  {listing.title || 'Swipess Listing'}
                </h1>
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-4 h-4 text-[#FF4D00] flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider truncate">
                    {[listing.neighborhood, listing.city].filter(Boolean).join(', ') || 'Location'}
                  </span>
                </div>
                <div className="flex items-end justify-between pt-1">
                  <div>
                    <div className="text-3xl font-black tracking-tight text-white leading-none">
                      ${listing.price?.toLocaleString() || '—'}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mt-1.5">
                      {mode === 'rent' ? 'Per Cycle' : 'Total'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { icon: Bed, value: listing.beds, label: 'Beds' },
                      { icon: Bath, value: listing.baths, label: 'Baths' },
                      { icon: Square, value: listing.square_footage, label: 'Sq Ft' },
                    ].map((s, i) => (
                      <div key={i} className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 flex flex-col items-center justify-center">
                        <s.icon className="w-3.5 h-3.5 text-white/70 mb-0.5" />
                        <span className="text-sm font-black tabular-nums leading-none text-white">{s.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          {user ? (
            <Button
              onClick={() => { triggerHaptic('success'); setShowDirectMessageDialog(true); }}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#EB4898] to-[#FF4D00] text-white font-bold uppercase tracking-wider shadow-[0_10px_30px_rgba(235,72,152,0.35)] active:scale-[0.98] transition-transform"
            >
              <MessageCircle className="w-5 h-5 mr-2.5" />
              Message Owner
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCreateAccount}
                className="w-full h-14 rounded-2xl bg-white text-black font-bold uppercase tracking-wider hover:bg-white/95 active:scale-[0.98] transition-transform shadow-2xl"
              >
                <UserPlus className="w-5 h-5 mr-2.5" />
                Create Account
              </Button>
              <Button
                onClick={handleSignIn}
                className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider border border-white/20 active:scale-[0.98] transition-transform backdrop-blur-xl"
              >
                <LogIn className="w-5 h-5 mr-2.5" />
                Sign In
              </Button>
              <p className="text-center text-[11px] text-white/40 pt-2">
                Join Swipess to message the owner and unlock the full deck.
              </p>
            </>
          )}
        </motion.div>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 pt-4">
          Powered by Swipess
        </p>
      </div>

      {listing && user && (
        <DirectMessageDialog
          open={showDirectMessageDialog}
          onOpenChange={setShowDirectMessageDialog}
          onConfirm={() => setShowDirectMessageDialog(false)}
          recipientName="Asset Authority"
          category={category}
        />
      )}

      {listing && (
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          listingId={id}
          title={listing.title || 'Swipess Listing'}
          description={`${listing.title || 'Listing'} — ${listing.beds || 0}B/${listing.baths || 0}B in ${listing.city || 'Tulum'} for $${listing.price?.toLocaleString() || '—'}.`}
        />
      )}
    </div>
  );
}
