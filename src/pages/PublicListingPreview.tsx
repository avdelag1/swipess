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
  ArrowLeft, Users, Calendar, Sparkles, ChevronLeft, ChevronRight, Share2, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { STORAGE } from '@/constants/app';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';
import { SaveButton } from '@/components/SaveButton';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { SEO } from '@/components/SEO';
import { ShareDialog } from '@/components/ShareDialog';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';

const FREE_MESSAGING_CATEGORIES = ['motorcycle', 'bicycle'];

export default function PublicListingPreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useAppTheme();

  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

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
      case 'yacht': return <Anchor className="w-4 h-4" />;
      case 'motorcycle': return <MotorcycleIcon className="w-4 h-4" />;
      case 'bicycle': return <Bike className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'motorcycle': return 'Vespa/Moto';
      case 'bicycle': return 'Beach Cruiser';
      default: return 'Swipess Estate';
    }
  };

  const nextImg = useCallback(() => {
    const imgs = Array.isArray(listing?.images) ? (listing!.images as string[]) : [];
    if (imgs.length === 0) return;
    triggerHaptic('light');
    setCurrentImageIndex(i => (i + 1) % imgs.length);
    setImgLoaded(false);
  }, [listing?.images]);

  const prevImg = useCallback(() => {
    const imgs = Array.isArray(listing?.images) ? (listing!.images as string[]) : [];
    if (imgs.length === 0) return;
    triggerHaptic('light');
    setCurrentImageIndex(i => (i - 1 + imgs.length) % imgs.length);
    setImgLoaded(false);
  }, [listing?.images]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#020202] flex items-center justify-center">
        <AtmosphericLayer variant="nexus" opacity={0.12} />
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="w-20 h-20 rounded-[40px] border-4 border-[#EB4898]/10 border-t-[#EB4898] animate-spin shadow-[0_0_40px_rgba(235,72,152,0.2)]" />
          <div className="space-y-2 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#EB4898] animate-pulse ml-2 italic">Synchronizing Asset</p>
             <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden mx-auto">
               <motion.div 
                 initial={{ x: '-100%' }}
                 animate={{ x: '100%' }}
                 transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                 className="h-full w-full bg-gradient-to-r from-transparent via-[#EB4898] to-transparent" 
               />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="fixed inset-0 bg-[#020202] flex flex-col items-center justify-center p-10 text-center">
        <AtmosphericLayer variant="nexus" opacity={0.15} />
        <div className="w-28 h-28 rounded-[40px] bg-white/5 flex items-center justify-center mb-10 border border-white/10 backdrop-blur-3xl shadow-2xl relative z-10">
          <Home className="w-12 h-12 text-white/10" />
        </div>
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4 leading-none relative z-10">Asset Null</h1>
        <p className="text-white/40 text-[11px] font-black max-w-xs mb-12 leading-relaxed uppercase tracking-[0.25em] italic relative z-10">The requested digital twin has been de-listed or moved to another cluster.</p>
        <Button 
          onClick={() => { triggerHaptic('medium'); navigate('/'); }} 
          className="w-full max-w-[300px] h-18 rounded-[24px] bg-white text-black font-black uppercase italic tracking-widest shadow-2xl relative z-10 hover:bg-white/90 active:scale-95 transition-all"
        >
          Return to Nexus
        </Button>
      </div>
    );
  }

  const category = listing.category || 'property';
  const mode = (listing as any).listing_type || 'rent';
  const images = (listing.images && Array.isArray(listing.images) ? listing.images : []) as string[];
  const currentImage = images[currentImageIndex] || null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#020202] text-white">
      <SEO 
        title={listing.title || 'Swipess Asset'}
        description={`${listing.beds || 0} Beds • ${listing.baths || 0} Baths • ${listing.city || 'Tulum'} — $${listing.price?.toLocaleString()}`}
        image={images[0] || 'https://swipess.app/og-image-nexus.png'}
        url={`https://swipess.app/listing/${id}`}
        type="website"
      />

      <AtmosphericLayer variant="nexus" opacity={0.1} />
      
      {/* 🛸 CINEMATIC IMAGE MATRIX */}
      <div className="absolute inset-x-0 top-0 h-[68%] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt="Asset"
                className="w-full h-full object-cover"
                onLoad={() => setImgLoaded(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FF4D00]/20 via-black to-[#EB4898]/20 flex items-center justify-center">
                 <SwipessLogo size="lg" variant="transparent" className="opacity-20" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* HUD OVERLAYS */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent pointer-events-none" />

        {/* TAP ZONES */}
        <div className="absolute inset-0 flex z-10">
          <div className="flex-1 cursor-w-resize" onClick={prevImg} />
          <div className="flex-1 cursor-e-resize" onClick={nextImg} />
        </div>

        {/* PAGINATION HUD */}
        <div className="absolute bottom-12 inset-x-0 flex justify-center gap-2 z-20 pointer-events-none">
          {images.map((_, i) => (
            <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", i === currentImageIndex ? "w-10 bg-[#EB4898] shadow-[0_0_15px_rgba(235,72,152,0.8)]" : "w-2.5 bg-white/20")} />
          ))}
        </div>
      </div>

      {/* 🛸 FLAGSHIP TOP BAR */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+16px)] inset-x-6 z-50 flex items-center justify-between pointer-events-none">
         <button 
           onClick={() => { triggerHaptic('light'); navigate(-1); }} 
           className="w-14 h-14 rounded-[20px] bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-90 shadow-2xl hover:bg-black/60 transition-all"
         >
            <ArrowLeft className="w-7 h-7" />
         </button>
         
         <div className="bg-[#EB4898]/10 backdrop-blur-2xl border border-[#EB4898]/20 px-5 py-2 rounded-2xl h-14 flex items-center gap-3 shadow-[0_0_30px_rgba(235,72,152,0.1)] pointer-events-auto">
            <Zap className="w-5 h-5 text-[#EB4898] fill-current animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EB4898] italic">Nexus Active</span>
         </div>

          <div className="flex gap-3 pointer-events-auto">
            <button 
               onClick={() => { triggerHaptic('light'); setShowShareDialog(true); }}
               className="w-14 h-14 rounded-[20px] bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white active:scale-90 shadow-2xl hover:bg-black/60 transition-all"
            >
               <Share2 className="w-6 h-6" />
            </button>
            <SaveButton targetId={listing.id} targetType="listing" className="w-14 h-14 rounded-[20px] shadow-2xl backdrop-blur-2xl border border-white/10" variant="circular" />
          </div>
      </div>

      {/* 🛸 Swipess BOTTOM TERMINAL */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 z-40 rounded-t-[48px] shadow-[0_-30px_80px_rgba(0,0,0,0.8)] border-t transition-all duration-500 bg-[#0A0A0A]/95 backdrop-blur-3xl border-white/[0.08]"
      >
         <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF4D00]/5 rounded-full blur-[120px] -translate-y-40 translate-x-40" />
         
         {/* DRAG HANDLE */}
         <div className="flex justify-center pt-6 pb-4 relative z-10">
            <div className="w-16 h-1.5 rounded-full bg-white/10" />
         </div>

         <div className="px-8 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+32px)] space-y-8 max-h-[62vh] overflow-y-auto custom-scrollbar relative z-10">
            {/* BADGE MATRIX */}
            <div className="flex flex-wrap gap-2.5">
               <Badge className="bg-[#EB4898]/10 text-[#EB4898] border border-[#EB4898]/20 text-[10px] font-black uppercase italic tracking-widest px-4 py-2 rounded-2xl shadow-[0_0_15px_rgba(235,72,152,0.1)]">
                  {getCategoryIcon(category)}
                  <span className="ml-2.5">{getCategoryLabel(category)}</span>
               </Badge>
               <Badge className={cn("text-[10px] font-black uppercase italic tracking-widest px-4 py-2 rounded-2xl border", 
                  mode === 'sale' ? "bg-[#FF4D00]/10 text-[#FF4D00] border-[#FF4D00]/20 shadow-[0_0_15px_rgba(255,77,0,0.1)]" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
               )}>
                  {mode === 'sale' ? 'Liquidation' : 'Nexus Residency'}
               </Badge>
               {(listing as any).verified && (
                 <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase italic tracking-widest px-4 py-2 rounded-2xl">
                    Verified Hub
                 </Badge>
               )}
            </div>

            {/* IDENTITY CORE */}
            <div className="flex items-start justify-between gap-6 px-1">
               <div className="space-y-4 flex-1">
                  <h1 className="text-4xl font-black italic tracking-tighter leading-tight uppercase text-white">{listing.title || 'Swipess Asset'}</h1>
                  <div className="flex items-center gap-3 text-white/40">
                    <MapPin className="w-4 h-4 text-[#FF4D00]" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] italic truncate max-w-[200px]">{listing.city || 'Tulum'}, {listing.neighborhood || 'Tulum Central'}</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-4xl font-black italic tracking-tighter text-[#EB4898] leading-none">${listing.price?.toLocaleString()}</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mt-3 italic">{mode === 'rent' ? 'Per Cycle' : 'Full Authority'}</div>
               </div>
            </div>

            {/* DATA GRID */}
            <div className="grid grid-cols-3 gap-5">
               {[
                 { label: 'Beds', value: listing.beds || '-', icon: Bed },
                 { label: 'Baths', value: listing.baths || '-', icon: Bath },
                 { label: 'Sq Ft', value: listing.square_footage || '-', icon: Square },
               ].map((stat, i) => (
                 <div key={i} className="p-6 rounded-[32px] border bg-white/[0.03] border-white/[0.05] flex flex-col items-center gap-3 text-center transition-all shadow-inner hover:bg-white/[0.06]">
                    <stat.icon className="w-6 h-6 text-[#EB4898]" />
                    <span className="text-2xl font-black italic tracking-tighter leading-none text-white tabular-nums">{stat.value}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 italic">{stat.label}</span>
                 </div>
               ))}
            </div>

            {/* SYNC ACTIONS */}
            <div className="space-y-4 pt-8 border-t border-white/[0.05]">
                {user ? (
                   <Button
                      onClick={() => { triggerHaptic('success'); setShowDirectMessageDialog(true); }}
                      className="w-full h-18 sm:h-20 rounded-[28px] bg-gradient-to-r from-[#EB4898] to-[#FF4D00] text-white font-black uppercase italic tracking-[0.25em] shadow-[0_15px_40px_rgba(235,72,152,0.3)] border-none hover:opacity-90 active:scale-95 transition-all text-base sm:text-lg"
                   >
                      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 mr-4" />
                      Manifest Direct Sync
                   </Button>
                ) : (
                   <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Button
                        onClick={() => { triggerHaptic('success'); navigate(`/?returnTo=/listing/${id}`); }}
                        className="w-full sm:flex-1 h-16 sm:h-18 rounded-[24px] bg-white text-black font-black uppercase italic tracking-[0.2em] shadow-2xl border-none hover:bg-white/90 transition-all text-sm"
                      >
                         <UserPlus className="w-5 h-5 mr-3" />
                         Initialize Identity
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { triggerHaptic('medium'); navigate('/'); }}
                        className="w-full sm:flex-1 h-16 sm:h-18 rounded-[24px] font-black uppercase tracking-[0.2em] italic text-sm transition-all border-white/10 text-white bg-white/5 hover:bg-white/10 active:scale-95 shadow-xl"
                      >
                         <LogIn className="w-5 h-5 mr-3" />
                         Authorized Login
                      </Button>
                   </div>
                )}
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-20 pt-8 pb-4 italic">Nexus Protocol · Asset Class Alpha</p>
         </div>
      </motion.div>

      {listing && user && (
        <DirectMessageDialog
          open={showDirectMessageDialog}
          onOpenChange={setShowDirectMessageDialog}
          onConfirm={() => setShowDirectMessageDialog(false)}
          recipientName="Asset Authority"
          category={category}
        />
      )}
      
      <ShareDialogWrapper 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog} 
        listing={listing} 
        id={id} 
      />
    </div>
  );
}

function ShareDialogWrapper({ open, onOpenChange, listing, id }: any) {
  if (!listing) return null;
  return (
    <ShareDialog
      open={open}
      onOpenChange={onOpenChange}
      listingId={id}
      title={listing.title || 'Elite Swipess Asset'}
      description={`💎 ${listing.title || 'Asset'} — ${listing.beds || 0}B/${listing.baths || 0}B in ${listing.city || 'Tulum'} for $${listing.price?.toLocaleString()}. Discover more on Swipess.`}
    />
  );
}

      {listing && user && (
        <DirectMessageDialog
          open={showDirectMessageDialog}
          onOpenChange={setShowDirectMessageDialog}
          onConfirm={() => setShowDirectMessageDialog(false)}
          recipientName="Asset Authority"
          category={category}
        />
      )}
      
      <ShareDialogWrapper 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog} 
        listing={listing} 
        id={id} 
      />
    </div>
  );
}

function ShareDialogWrapper({ open, onOpenChange, listing, id }: any) {
  if (!listing) return null;
  return (
    <ShareDialog
      open={open}
      onOpenChange={onOpenChange}
      listingId={id}
      title={listing.title || 'Elite Swipess Asset'}
      description={`💎 ${listing.title || 'Asset'} — ${listing.beds || 0}B/${listing.baths || 0}B in ${listing.city || 'Tulum'} for $${listing.price?.toLocaleString()}. Discover more on Swipess.`}
    />
  );
}




