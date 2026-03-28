import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DirectMessageDialog } from '@/components/DirectMessageDialog';
import {
  Home, MapPin, Bed, Bath, Square, LogIn, UserPlus,
  Anchor, Bike, Car, Eye, Flame, MessageCircle,
  ArrowLeft, Users, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { STORAGE } from '@/constants/app';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';

const FREE_MESSAGING_CATEGORIES = ['motorcycle', 'bicycle'];

export default function PublicListingPreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  // View count increment
  useQuery({
    queryKey: ['listing-view', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        await supabase
          .from('listings')
          .update({ views: ((listing as any)?.views || 0) + 1 })
          .eq('id', id);
      } catch { /* silent */ }
      return true;
    },
    enabled: !!id && !!listing,
    staleTime: Infinity,
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'yacht': return <Anchor className="w-3.5 h-3.5" />;
      case 'motorcycle': return <MotorcycleIcon className="w-3.5 h-3.5" />;
      case 'bicycle': return <Bike className="w-3.5 h-3.5" />;
      case 'vehicle': return <Car className="w-3.5 h-3.5" />;
      default: return <Home className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'yacht': return 'Yacht';
      case 'motorcycle': return 'Motorcycle';
      case 'bicycle': return 'Bicycle';
      case 'vehicle': return 'Vehicle';
      default: return 'Property';
    }
  };

  const prevImage = useCallback(() => {
    setCurrentImageIndex(i => Math.max(0, i - 1));
    setImgLoaded(false);
  }, []);

  const nextImage = useCallback((total: number) => {
    setCurrentImageIndex(i => Math.min(total - 1, i + 1));
    setImgLoaded(false);
  }, []);

  // ── Loading State ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background">
        <Skeleton className="absolute inset-0 rounded-none" />
        {/* Top bar skeleton */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-background/60 backdrop-blur-lg" />
        {/* Bottom sheet skeleton */}
        <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-2xl rounded-t-3xl border-t border-border/20 p-6 space-y-4">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error / Not Found ──────────────────────────────────────────────
  if (error || !listing) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This listing may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate('/')} size="lg" className="w-full rounded-2xl">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  const category = listing.category || 'property';
  const mode = (listing as any).listing_type || 'rent';
  const images = (listing.images && Array.isArray(listing.images) ? listing.images : []) as string[];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : null;
  const isFreeMessagingCategory = FREE_MESSAGING_CATEGORIES.includes(category);
  const _canDirectMessage = user && isFreeMessagingCategory && user.id !== listing.owner_id;

  const locationStr = [
    listing.address,
    listing.neighborhood || (listing as any).neighborhood,
    listing.city,
  ].filter(Boolean).join(', ');

  // ── Main Render ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">

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
                alt={listing.title || 'Listing'}
                className="w-full h-full object-cover"
                onLoad={() => setImgLoaded(true)}
                style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-500/40 via-pink-500/30 to-purple-500/40" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlays — never block image but ensure legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* ── IMAGE TAP ZONES (left/right to navigate) ─────────────────── */}
      {images.length > 1 && (
        <>
          <div
            className="absolute left-0 top-[20%] bottom-[45%] w-1/3 z-10 cursor-pointer"
            onClick={prevImage}
          />
          <div
            className="absolute right-0 top-[20%] bottom-[45%] w-1/3 z-10 cursor-pointer"
            onClick={() => nextImage(images.length)}
          />
        </>
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
      >
        {/* Back button */}
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

        {/* Swipess logo pill */}
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg h-9">
          <SwipessLogo size="xs" />
        </div>

        {/* Auth action */}
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
      {images.length > 1 && (
        <div
          className="absolute z-[60] left-0 right-0 flex justify-center gap-1.5"
          style={{ top: 'max(62px, calc(env(safe-area-inset-top, 0px) + 50px))' }}
        >
          {images.map((_, i) => (
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
          className="bg-background/92 backdrop-blur-2xl rounded-t-[28px] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.4)]"
          style={{ '--tw-bg-opacity': 0.92 } as React.CSSProperties}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border/60 rounded-full" />
          </div>

          <div className="px-5 pt-2 pb-5 space-y-4 max-h-[58vh] overflow-y-auto overscroll-contain">

            {/* Category + Mode badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/15 text-primary border border-primary/25 text-xs font-medium flex items-center gap-1 py-0.5">
                {getCategoryIcon(category)}
                {getCategoryLabel(category)}
              </Badge>
              <Badge className={cn(
                'text-xs font-medium py-0.5 border',
                mode === 'sale' ? 'bg-purple-500/15 text-purple-500 border-purple-500/25' :
                mode === 'both' ? 'bg-amber-500/15 text-amber-600 border-amber-500/25' :
                'bg-blue-500/15 text-blue-500 border-blue-500/25'
              )}>
                {mode === 'sale' ? 'For Sale' : mode === 'both' ? 'Rent / Sale' : 'For Rent'}
              </Badge>
              {(listing as any).verified && (
                <Badge className="bg-rose-500/15 text-rose-600 border border-rose-500/25 text-xs font-medium py-0.5">
                  Verified
                </Badge>
              )}
            </div>

            {/* Title + Price */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground leading-snug">
                  {listing.title || 'Untitled Listing'}
                </h1>
                {locationStr && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{locationStr}</span>
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-primary leading-none">
                  ${listing.price?.toLocaleString() || 'TBD'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {mode === 'rent' ? '/ month' : mode === 'sale' ? 'total' : 'sale/rent'}
                </div>
              </div>
            </div>

            {/* Property stats */}
            {category === 'property' && (listing.beds || listing.baths || listing.square_footage) && (
              <div className="grid grid-cols-3 gap-2">
                {listing.beds && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <Bed className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{listing.beds}</span>
                    <span className="text-[11px] text-muted-foreground">Beds</span>
                  </div>
                )}
                {listing.baths && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <Bath className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{listing.baths}</span>
                    <span className="text-[11px] text-muted-foreground">Baths</span>
                  </div>
                )}
                {listing.square_footage && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <Square className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{listing.square_footage}</span>
                    <span className="text-[11px] text-muted-foreground">Sq ft</span>
                  </div>
                )}
              </div>
            )}

            {/* Yacht stats */}
            {category === 'yacht' && (
              <div className="grid grid-cols-3 gap-2">
                {(listing as any).length_m && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <Anchor className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{(listing as any).length_m}m</span>
                    <span className="text-[11px] text-muted-foreground">Length</span>
                  </div>
                )}
                {(listing as any).berths && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <Bed className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{(listing as any).berths}</span>
                    <span className="text-[11px] text-muted-foreground">Berths</span>
                  </div>
                )}
                {(listing as any).max_passengers && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{(listing as any).max_passengers}</span>
                    <span className="text-[11px] text-muted-foreground">Guests</span>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle/Moto/Bicycle stats */}
            {(category === 'motorcycle' || category === 'bicycle' || category === 'vehicle') && (
              <div className="grid grid-cols-3 gap-2">
                {(listing as any).engine_cc && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <MotorcycleIcon className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{(listing as any).engine_cc}cc</span>
                    <span className="text-[11px] text-muted-foreground">Engine</span>
                  </div>
                )}
                {(listing as any).mileage && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-foreground">{(listing as any).mileage?.toLocaleString()}</span>
                    <span className="text-[11px] text-muted-foreground">Miles</span>
                  </div>
                )}
                {((listing as any).condition || (listing as any).vehicle_condition) && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-xl border border-border/30">
                    <span className="text-base">✓</span>
                    <span className="text-base font-bold text-foreground capitalize">
                      {(listing as any).condition || (listing as any).vehicle_condition}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Condition</span>
                  </div>
                )}
              </div>
            )}

            {/* Feature tags */}
            {(listing.property_type || (listing as any).furnished || (listing as any).pet_friendly || (listing as any).availability_date) && (
              <div className="flex flex-wrap gap-1.5">
                {listing.property_type && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {listing.property_type}
                  </Badge>
                )}
                {(listing as any).furnished && (
                  <Badge variant="outline" className="text-xs rounded-full border-border/50">
                    Furnished
                  </Badge>
                )}
                {(listing as any).pet_friendly && (
                  <Badge variant="outline" className="text-xs rounded-full border-border/50">
                    🐾 Pet Friendly
                  </Badge>
                )}
                {(listing as any).availability_date && (
                  <Badge variant="outline" className="text-xs rounded-full border-border/50 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date((listing as any).availability_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            )}

            {/* Quick stats row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/30 pt-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {(listing as any).views || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {(listing as any).likes || 0} likes
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {user ? (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold h-12 text-base shadow-lg shadow-primary/25"
                    onClick={() => setShowDirectMessageDialog(true)}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Message Owner
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
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-12 text-base shadow-lg shadow-primary/25"
                    onClick={() => navigate(`/?returnTo=/listing/${id}`)}
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
              )}
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-muted-foreground/60 pb-1">
              Swipess · Find Your Perfect Match
            </p>
          </div>
        </motion.div>
      </div>

      {/* Direct Message Dialog */}
      {listing && user && (
        <DirectMessageDialog
          open={showDirectMessageDialog}
          onOpenChange={setShowDirectMessageDialog}
          onConfirm={() => setShowDirectMessageDialog(false)}
          recipientName="the owner"
          category={category}
        />
      )}
    </div>
  );
}
