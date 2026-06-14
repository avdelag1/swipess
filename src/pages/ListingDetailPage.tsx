import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { Suspense, useEffect, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useSwipe } from '@/hooks/useSwipe';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { ArrowLeft, Bath, Bed, Heart, Home, MapPin, MessageCircle, Share2, Square } from 'lucide-react';

const ReportDialog = lazyWithRetry(() => import('@/components/ReportDialog').then(m => ({ default: m.ReportDialog })));
const ShareDialog = lazyWithRetry(() => import('@/components/ShareDialog').then(m => ({ default: m.ShareDialog })));

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const swipe = useSwipe();

  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [liked, setLiked] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Owners should manage their listing via the properties page, not see the public detail view
  useEffect(() => {
    if (listing && user && (listing as any).owner_id === user.id) {
      navigate('/owner/properties', { replace: true });
    }
  }, [listing, user, navigate]);

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  if (!listing) return <div className="w-full h-screen flex flex-col items-center justify-center bg-background gap-4 p-6"><p className="text-muted-foreground">Listing not found</p><button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button></div>;

  const l = listing as any;
  const images: string[] = Array.isArray(l.images) ? l.images.filter(Boolean) : (l.image_url ? [l.image_url] : []);
  const hero = images[0] || '';
  const category = String(l.category || 'property');
  const isRental = l.listing_type === 'rental';
  const priceUnit = isRental ? (l.rental_duration_type === 'monthly' ? '/mo' : '/day') : '';
  const price = l.price != null ? `$${Number(l.price).toLocaleString()}${priceUnit}` : null;
  const locationLabel = l.address || l.city || '';

  const specs: { icon: typeof Bed; label: string; value: string }[] = [];
  if (l.beds != null) specs.push({ icon: Bed, label: 'Beds', value: String(l.beds) });
  if (l.baths != null) specs.push({ icon: Bath, label: 'Baths', value: String(l.baths) });
  if (l.square_footage) specs.push({ icon: Square, label: 'ft²', value: String(l.square_footage) });
  if (l.property_type) specs.push({ icon: Home, label: '', value: String(l.property_type) });

  const handleContact = () => {
    triggerHaptic('medium');
    const ownerId = l.owner_id || l.user_id;
    if (ownerId) navigate(`/messages?startConversation=${ownerId}`);
    else navigate('/messages');
  };

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    triggerHaptic(next ? 'success' : 'light');
    // Persist a like the first time it's turned on (same store the swipe deck uses)
    if (next) {
      swipe.mutate({ targetId: l.id, direction: 'right', targetType: 'listing', targetObject: listing });
    }
  };

  const textPri = isLight ? 'text-slate-900' : 'text-white';
  const textSec = isLight ? 'text-slate-500' : 'text-white/50';
  const pageBg = isLight ? 'bg-slate-50' : 'bg-black';

  return (
    <motion.div
      className={cn('relative w-full min-h-screen overflow-y-auto scrollbar-hide', pageBg)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]">

        {/* ── Premium hero photo card (rounded, floating, edge spacing) ── */}
        <div className="px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="relative w-full aspect-[4/5] max-h-[68vh] rounded-[30px] overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10"
          >
            {hero ? (
              <img src={hero} alt={l.title || 'Property'} className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Home className="w-12 h-12 text-white/30" /></div>
            )}

            {/* Subtle gradient only for control legibility — no dots, no counters */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />

            {/* Back — minimal glass */}
            <button
              onClick={() => { triggerHaptic('light'); navigate(-1); }}
              aria-label="Back"
              className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/25 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Favorite — translucent glass heart with spring pop */}
            <motion.button
              onClick={toggleLike}
              aria-label={liked ? 'Remove from saved' : 'Save'}
              aria-pressed={liked}
              whileTap={{ scale: 0.82 }}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/25 backdrop-blur-xl border border-white/20 flex items-center justify-center"
            >
              <motion.span
                key={liked ? 'on' : 'off'}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 520, damping: 14 }}
              >
                <Heart className={cn('w-[22px] h-[22px] transition-colors', liked ? 'fill-rose-500 text-rose-500' : 'text-white')} />
              </motion.span>
            </motion.button>
          </motion.div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 pt-7 space-y-7">

          {/* Category · title · location */}
          <div className="space-y-3">
            <span className={cn('inline-block text-[10px] font-black uppercase tracking-[0.3em]', textSec)}>
              {category}{isRental ? ' • Rental' : ''}
            </span>
            <h1 className={cn('text-[2rem] leading-[1.05] font-black tracking-tight', textPri)}>{l.title || 'Untitled'}</h1>
            {locationLabel && (
              <div className={cn('flex items-center gap-1.5', textSec)}>
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-semibold">{locationLabel}</span>
              </div>
            )}
          </div>

          {/* Price + secondary glass actions */}
          <div className="flex items-end justify-between gap-4">
            {price && (
              <div>
                <p className={cn('text-[10px] font-black uppercase tracking-[0.25em] mb-1', textSec)}>Price</p>
                <p className={cn('text-[26px] font-black tracking-tight', textPri)}>{price}</p>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <GlassIconButton icon={Share2} onClick={() => { triggerHaptic('light'); setShowShare(true); }} label="Share" tone={isLight ? 'surface' : 'onPhoto'} size="md" />
              <GlassIconButton icon={MessageCircle} onClick={handleContact} label="Contact" tone={isLight ? 'surface' : 'onPhoto'} size="md" />
            </div>
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {specs.map((s, i) => (
                <div key={i} className={cn('flex items-center gap-2 px-4 py-3 rounded-2xl border', isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-white/[0.04] border-white/10')}>
                  <s.icon className={cn('w-4 h-4', textSec)} />
                  <span className={cn('text-sm font-black', textPri)}>{s.value}</span>
                  {s.label && <span className={cn('text-xs font-semibold', textSec)}>{s.label}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {l.description && (
            <div className="space-y-2.5">
              <h2 className={cn('text-[11px] font-black uppercase tracking-[0.3em]', textSec)}>About</h2>
              <p className={cn('text-[15px] leading-relaxed whitespace-pre-wrap', isLight ? 'text-slate-600' : 'text-white/70')}>{l.description}</p>
            </div>
          )}

          {/* Subtle report link */}
          <button
            onClick={() => { triggerHaptic('light'); setShowReport(true); }}
            className={cn('text-xs font-semibold underline underline-offset-2', textSec)}
          >
            Report this listing
          </button>
        </div>
      </div>

      <Suspense fallback={null}><ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reportedListingId={l.id}
        reportedListingTitle={l.title || 'Listing'}
        reportedUserId={l.owner_id || l.user_id}
        reportedUserAge={l.owner_age}
        category="listing"
      /></Suspense>
      <Suspense fallback={null}><ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        listingId={l.id}
        title={l.title || 'Check out this listing'}
        description={l.description}
        previewImage={hero || null}
      /></Suspense>
    </motion.div>
  );
}
