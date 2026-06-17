import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { logger } from '@/utils/prodLogger';
import { useQuery } from '@tanstack/react-query';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
const DirectMessageDialog = lazyWithRetry(() => import('@/components/DirectMessageDialog').then(m => ({ default: m.DirectMessageDialog })));
import {
  Anchor, ArrowRight, Bath, Bed, Bike, ChevronLeft,
  Home, LogIn, MapPin, MessageCircle, Share2, ShieldCheck, Sparkles, Square, UserPlus,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { STORAGE } from '@/constants/app';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';
import { triggerHaptic } from '@/utils/haptics';
import { SEO } from '@/components/SEO';
const ShareDialog = lazyWithRetry(() => import('@/components/ShareDialog').then(m => ({ default: m.ShareDialog })));
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { PreviewSwipeCard } from '@/components/preview/PreviewSwipeCard';
import { ConnectingOverlay } from '@/components/ConnectingOverlay';
import { useStartConversation } from '@/hooks/useConversations';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { guardNewConversation, handleStartConversationError } from '@/utils/messagingQuotaUX';
import { NEXUS_GRADIENTS } from '@/utils/nexusTheme';

function formatPrice(price?: number | null): string {
  if (price == null || Number.isNaN(price)) return '—';
  return `$${price.toLocaleString()}`;
}

export default function PublicListingPreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const startConversation = useStartConversation();
  const { canStartNewConversation } = useMessagingQuota();
  const refCode = searchParams.get('ref');
  const isGuest = !user;

  useEffect(() => {
    if (refCode && refCode.length > 0) {
      if (user?.id && user.id === refCode) return;
      localStorage.setItem(STORAGE.REFERRAL_CODE_KEY, JSON.stringify({
        code: refCode,
        capturedAt: Date.now(),
        source: `/listing/${id}`,
      }));
    }
  }, [refCode, id, user?.id]);

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

  const category = listing?.category || 'property';
  const mode = (listing as { listing_type?: string } | undefined)?.listing_type || 'rent';
  const images = useMemo(
    () => (Array.isArray(listing?.images) ? listing.images : []) as string[],
    [listing?.images],
  );
  const heroImage = images[0] || `${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/og-image-Swipes.png`;
  const locationLabel = [listing?.neighborhood, listing?.city].filter(Boolean).join(', ') || 'Location on request';
  const description = typeof listing?.description === 'string' ? listing.description.trim() : '';

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

  const handleCreateAccount = () => {
    triggerHaptic('success');
    navigate(`/?returnTo=/listing/${id}&intent=signup`);
  };

  const handleSignIn = () => {
    triggerHaptic('medium');
    navigate(`/?returnTo=/listing/${id}&intent=signin`);
  };

  const handleSendMessage = async (text: string) => {
    if (!listing?.owner_id || isCreatingConversation) return;
    if (!guardNewConversation(canStartNewConversation)) return;

    setIsCreatingConversation(true);
    triggerHaptic('medium');

    try {
      const result = await startConversation.mutateAsync({
        otherUserId: listing.owner_id,
        listingId: listing.id,
        initialMessage: text,
        canStartNewConversation,
      });

      setShowDirectMessageDialog(false);
      setIsConnecting(true);

      if (result?.conversationId) {
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (err) {
      logger.error('[PublicListingPreview] Failed to send message:', err);
      triggerHaptic('error');
      handleStartConversationError(err);
    } finally {
      setIsCreatingConversation(false);
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#07070d] flex flex-col p-6 pt-safe relative z-10">
        <AtmosphericLayer variant="Swipes" opacity={0.1} />
        <div className="relative z-10 max-w-md mx-auto w-full mt-8">
          <div className="aspect-[4/5] rounded-[2rem] bg-white/5 border border-white/10 animate-pulse mb-4" />
          <div className="h-6 bg-white/5 rounded-xl w-3/4 animate-pulse mb-2" />
          <div className="h-4 bg-white/5 rounded-lg w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="fixed inset-0 bg-[#07070d] flex flex-col items-center justify-center p-8 text-center">
        <AtmosphericLayer variant="Swipes" opacity={0.15} />
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 relative z-10">
          <Home className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3 relative z-10">Listing Not Found</h1>
        <p className="text-white/50 text-sm max-w-xs mb-8 relative z-10">
          This listing is no longer available or the link may have expired.
        </p>
        <Button
          onClick={() => { triggerHaptic('medium'); navigate('/'); }}
          className="h-14 px-10 rounded-2xl bg-white text-black font-bold relative z-10"
        >
          Explore Swipess
        </Button>
      </div>
    );
  }

  const seoDescription = `${listing.beds || 0} beds · ${listing.baths || 0} baths · ${listing.city || 'Swipess'} — ${formatPrice(listing.price)}`;

  return (
    <div className="fixed inset-0 w-full bg-[#07070d] text-white flex flex-col overflow-hidden">
      <SEO
        title={listing.title || 'Swipess Listing'}
        description={seoDescription}
        image={heroImage}
        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://swipess.com'}/listing/${id}`}
        type="website"
      />

      <AtmosphericLayer variant="Swipes" opacity={0.07} />

      {/* Top nav */}
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

      {/* Guest welcome strip */}
      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-40 mx-4 mb-2 shrink-0"
        >
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#8B5CF6]/15 via-black/40 to-[#6366F1]/15 backdrop-blur-xl px-4 py-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EB4898]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#EB4898]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-white">
                {refCode ? 'A friend shared this with you' : 'Shared listing preview'}
              </p>
              <p className="text-[10px] text-white/55 mt-0.5 leading-relaxed">
                Create a free account to message the owner, save listings, and swipe more deals near you.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div
        className="flex-1 min-h-0 flex flex-col gap-3 max-w-md mx-auto w-full px-4 overflow-y-auto no-scrollbar"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        {/* Hero card */}
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
            fallback={<SwipessLogo size="lg" variant="transparent" className="opacity-30" />}
            badges={
              <>
                <Badge className="bg-black/55 backdrop-blur-xl text-white border border-white/15 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  {getCategoryIcon(category)}
                  <span className="ml-1.5">{getCategoryLabel(category)}</span>
                </Badge>
                <Badge className={cn(
                  'backdrop-blur-xl border text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full',
                  mode === 'sale'
                    ? 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/30'
                    : 'bg-[#EB4898]/20 text-[#EB4898] border-[#EB4898]/30',
                )}>
                  {mode === 'sale' ? 'For Sale' : 'For Rent'}
                </Badge>
              </>
            }
            overlay={
              <div className="space-y-2.5">
                <h1 className="text-[1.65rem] font-black uppercase tracking-tight leading-[1.05] text-white drop-shadow-lg line-clamp-2 break-words">
                  {listing.title || 'Swipess Listing'}
                </h1>
                <div className="flex items-center gap-2 text-white/85">
                  <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider truncate">{locationLabel}</span>
                </div>
                <div className="flex items-end justify-between pt-1 gap-3">
                  <div>
                    <div className="text-[1.75rem] font-black tracking-tight text-white leading-none">
                      {formatPrice(listing.price)}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mt-1">
                      {mode === 'rent' ? 'Per cycle' : 'Total price'}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { icon: Bed, value: listing.beds, label: 'Beds' },
                      { icon: Bath, value: listing.baths, label: 'Baths' },
                      { icon: Square, value: listing.square_footage, label: 'Sq Ft' },
                    ].map((s, i) => (
                      <div
                        key={i}
                        title={s.label}
                        className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 flex flex-col items-center justify-center"
                      >
                        <s.icon className="w-3 h-3 text-white/70 mb-0.5" />
                        <span className="text-[10px] font-black tabular-nums leading-none text-white">{s.value ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />
        </motion.div>

        {/* Details panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 space-y-3 shrink-0"
        >
          {description && (
            <p className="text-[13px] text-white/75 leading-relaxed line-clamp-4">{description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1]/15 border border-[#8B5CF6]/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]">
              <ShieldCheck className="w-3 h-3" />
              Verified on Swipess
            </span>
            {refCode && isGuest && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EB4898]/15 border border-[#EB4898]/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F9A8D4]">
                Referral applied
              </span>
            )}
          </div>
        </motion.div>

        {/* Sticky CTA dock */}
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
                onClick={() => {
                  triggerHaptic('success');
                  if (!guardNewConversation(canStartNewConversation)) return;
                  setShowDirectMessageDialog(true);
                }}
                className="w-full h-12 rounded-2xl text-white font-bold uppercase tracking-wider shadow-[0_10px_30px_rgba(139,92,246,0.35)] active:scale-[0.98] transition-transform"
                style={{ background: NEXUS_GRADIENTS.cta }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message Owner
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCreateAccount}
                  className="w-full h-12 rounded-2xl text-white font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-transform shadow-[0_12px_36px_rgba(99,102,241,0.4)] border border-white/15"
                  style={{ background: NEXUS_GRADIENTS.ai }}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Join Free to Contact Owner
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

      {listing && user && (
        <Suspense fallback={null}>
          <DirectMessageDialog
            open={showDirectMessageDialog}
            onOpenChange={setShowDirectMessageDialog}
            onConfirm={handleSendMessage}
            recipientName="Asset Authority"
            category={category}
            isLoading={isCreatingConversation}
          />
        </Suspense>
      )}

      {listing && (
        <Suspense fallback={null}>
          <ShareDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            listingId={id}
            title={listing.title || 'Swipess Listing'}
            description={`${listing.title || 'Listing'} — ${listing.beds || 0}B/${listing.baths || 0}B in ${listing.city || 'Swipess'} for ${formatPrice(listing.price)}.`}
            previewImage={heroImage}
          />
        </Suspense>
      )}

      <ConnectingOverlay
        isOpen={isConnecting}
        recipientName={listing?.title || 'Asset Owner'}
      />
    </div>
  );
}