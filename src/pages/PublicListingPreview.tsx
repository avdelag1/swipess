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
  ArrowLeft, Users, Calendar, Sparkles, ChevronLeft, ChevronRight, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { STORAGE } from '@/constants/app';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';
import { SaveButton } from '@/components/SaveButton';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';

const FREE_MESSAGING_CATEGORIES = ['motorcycle', 'bicycle'];

export default function PublicListingPreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, isLight } = useTheme();

  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);
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
      case 'vehicle': return <Car className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'yacht': return 'Admiral Class';
      case 'motorcycle': return 'Vespa/Moto';
      case 'bicycle': return 'Beach Cruiser';
      case 'vehicle': return 'Luxe Vehicle';
      default: return 'Property';
    }
  };

  const nextImg = useCallback(() => {
    if (!listing?.images) return;
    triggerHaptic('light');
    setCurrentImageIndex(i => (i + 1) % listing.images.length);
    setImgLoaded(false);
  }, [listing?.images]);

  const prevImg = useCallback(() => {
    if (!listing?.images) return;
    triggerHaptic('light');
    setCurrentImageIndex(i => (i - 1 + listing.images.length) % listing.images.length);
    setImgLoaded(false);
  }, [listing?.images]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] border-4 border-[#EB4898]/20 border-t-[#EB4898] animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] animate-pulse">Synchronizing Asset...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center mb-8 border border-white/10">
          <Home className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4 leading-none">Asset Not Found</h1>
        <p className="text-white/40 text-sm font-medium max-w-xs mb-10 leading-relaxed uppercase tracking-widest">The requested digital twin has been de-listed or moved to another cluster.</p>
        <Button onClick={() => navigate('/')} className="w-full max-w-[280px] h-16 rounded-[2rem] bg-white text-black font-black uppercase italic tracking-widest shadow-2xl">Return Home</Button>
      </div>
    );
  }

  const category = listing.category || 'property';
  const mode = (listing as any).listing_type || 'rent';
  const images = (listing.images && Array.isArray(listing.images) ? listing.images : []) as string[];
  const currentImage = images[currentImageIndex] || null;

  return (
    <div className={cn("fixed inset-0 overflow-hidden transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC IMAGE MATRIX */}
      <div className="absolute inset-x-0 top-0 h-[65%] overflow-hidden">
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
              <div className="w-full h-full bg-gradient-to-br from-[#EB4898] to-indigo-900" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* HUD OVERLAYS */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* TAP ZONES */}
        <div className="absolute inset-0 flex z-10">
          <div className="flex-1 cursor-w-resize" onClick={prevImg} />
          <div className="flex-1 cursor-e-resize" onClick={nextImg} />
        </div>

        {/* PAGINATION HUD */}
        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {images.map((_, i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === currentImageIndex ? "w-8 bg-[#EB4898]" : "w-2 bg-white/30")} />
          ))}
        </div>
      </div>

      {/* 🛸 FLAGSHIP TOP BAR */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+16px)] inset-x-6 z-50 flex items-center justify-between pointer-events-none">
         <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-[1.2rem] bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-90 shadow-2xl">
            <ArrowLeft className="w-6 h-6" />
         </button>
         <div className="bg-black/30 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full h-12 flex items-center shadow-2xl">
            <SwipessLogo size="sm" invert />
         </div>
         <div className="flex gap-2 pointer-events-auto">
            <button className="w-12 h-12 rounded-[1.2rem] bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 shadow-2xl">
               <Share2 className="w-5 h-5" />
            </button>
            <SaveButton targetId={listing.id} targetType="listing" className="w-12 h-12 rounded-[1.2rem] shadow-2xl" variant="circular" />
         </div>
      </div>

      {/* 🛸 NEXUS BOTTOM TERMINAL */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className={cn(
           "absolute inset-x-0 bottom-0 z-40 rounded-t-[3.5rem] shadow-[0_-30px_70px_rgba(0,0,0,0.5)] border-t transition-colors duration-500",
           isLight ? "bg-white border-black/5" : "bg-[#0d0d0f] border-white/10"
        )}
      >
         {/* DRAG HANDLE */}
         <div className="flex justify-center pt-5 pb-3">
            <div className={cn("w-14 h-1.5 rounded-full transition-colors", isLight ? "bg-black/10" : "bg-white/10")} />
         </div>

         <div className={cn(
            "px-8 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+32px)] space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar",
            isLight ? "text-black" : "text-white"
         )}>
            {/* BADGE MATRIX */}
            <div className="flex flex-wrap gap-2">
               <Badge className="bg-[#EB4898]/10 text-[#EB4898] border border-[#EB4898]/20 text-[10px] font-black uppercase italic tracking-widest px-3 py-1.5 rounded-[0.8rem]">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{getCategoryLabel(category)}</span>
               </Badge>
               <Badge className={cn("text-[10px] font-black uppercase italic tracking-widest px-3 py-1.5 rounded-[0.8rem] border", 
                  mode === 'sale' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
               )}>
                  {mode === 'sale' ? 'Liquidation' : 'Rental'}
               </Badge>
               {(listing as any).verified && (
                 <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase italic tracking-widest px-3 py-1.5 rounded-[0.8rem]">
                    Verified Hub
                 </Badge>
               )}
            </div>

            {/* IDENTITY CORE */}
            <div className="flex items-start justify-between gap-6 px-1">
               <div className="space-y-3 flex-1">
                  <h1 className="text-4xl font-black italic tracking-tighter leading-none uppercase">{listing.title || 'Listing'}</h1>
                  <div className="flex items-center gap-2 opacity-40">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-widest truncate max-w-[200px]">{listing.city || 'Tulum'}, {listing.neighborhood || 'Tulum Central'}</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-3xl font-black italic tracking-tighter text-[#EB4898] leading-none">${listing.price?.toLocaleString()}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-2">{mode === 'rent' ? 'Per Cycle' : 'Full Authority'}</div>
               </div>
            </div>

            {/* DATA GRID */}
            <div className="grid grid-cols-3 gap-4">
               {[
                 { label: 'Beds', value: listing.beds || '-', icon: Bed },
                 { label: 'Baths', value: listing.baths || '-', icon: Bath },
                 { label: 'Sq Ft', value: listing.square_footage || '-', icon: Square },
               ].map((stat, i) => (
                 <div key={i} className={cn("p-5 rounded-[2rem] border flex flex-col items-center gap-2 text-center transition-all", isLight ? "bg-black/5 border-black/5 shadow-inner" : "bg-white/5 border-white/5")}>
                    <stat.icon className="w-5 h-5 text-[#EB4898]/60" />
                    <span className="text-lg font-black italic tracking-tighter leading-none">{stat.value}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{stat.label}</span>
                 </div>
               ))}
            </div>

            {/* SYNC ACTIONS */}
            <div className="space-y-4 pt-4">
                {user ? (
                   <Button
                      onClick={() => { triggerHaptic('medium'); setShowDirectMessageDialog(true); }}
                      className="w-full h-20 rounded-[2.5rem] bg-[#EB4898] text-white font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(235,72,152,0.4)] border-none hover:scale-[1.02] active:scale-95 transition-all text-[15px]"
                   >
                      <MessageCircle className="w-7 h-7 mr-4" />
                      Manifest DM
                   </Button>
                ) : (
                   <div className="space-y-3">
                      <Button
                        onClick={() => { triggerHaptic('medium'); navigate(`/?returnTo=/listing/${id}`); }}
                        className="w-full h-20 rounded-[2.5rem] bg-[#EB4898] text-white font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(235,72,152,0.4)] border-none"
                      >
                         <UserPlus className="w-7 h-7 mr-4" />
                         Engage Reality
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { triggerHaptic('light'); navigate('/'); }}
                        className={cn("w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] italic opacity-40 hover:opacity-100 transition-all")}
                      >
                         De-cloak & Sign In
                      </Button>
                   </div>
                )}
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-10 pb-4">Profile</p>
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
    </div>
  );
}
