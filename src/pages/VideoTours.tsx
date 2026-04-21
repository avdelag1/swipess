import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Volume2, VolumeX, MapPin, DollarSign, Eye, ChevronLeft, Heart, Share2, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { logger } from '@/utils/prodLogger';

interface VideoListing {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  images: any;
  category?: string;
}

export default function VideoTours() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<VideoListing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVideoListings = async () => {
      try {
        const { data } = await supabase
          .from('listings')
          .select('id, title, location, price, currency, images, category')
          .eq('is_active', true)
          .not('images', 'is', null)
          .limit(20);
        setListings((data || []) as VideoListing[]);
      } catch (e) {
        logger.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideoListings();
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    if (itemHeight === 0) return;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      triggerHaptic('light');
    }
  }, [currentIndex]);

  const getImageUrl = (listing: VideoListing) => {
    if (Array.isArray(listing.images) && listing.images.length > 0) return listing.images[0];
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=90';
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Buffering Tours...</span>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center gap-6 p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Eye className="w-10 h-10 text-white/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">No Tours Available</h2>
          <p className="text-xs text-white/40 font-medium leading-relaxed">
            Property video tours will appear here as owners upload immersive walkthroughs of their spaces.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px]"
        >
          Return to Explore
        </motion.button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] bg-black overflow-hidden flex flex-col font-sans">
      
      {/* ── TOP NAV ── */}
      <div className="absolute top-[var(--safe-top)] left-0 right-0 z-50 flex items-center justify-between px-4 py-4 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-10 h-10 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        
        <div className="flex flex-col items-center opacity-80">
          <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Immersive</span>
          <span className="text-xs font-black text-white italic tracking-tight">VIDEO TOURS</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          aria-label="Share tour"
          className="w-10 h-10 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto"
        >
          <Share2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* ── VERTICAL FEED ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {listings.map((listing, index) => (
          <div key={listing.id} className="h-full w-full snap-start snap-always relative overflow-hidden bg-zinc-950">
            {/* Visual Media */}
            <div className="absolute inset-0">
              <motion.img
                initial={{ scale: 1.1 }}
                animate={index === currentIndex ? { scale: 1 } : { scale: 1.1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={getImageUrl(listing)}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {/* Complex Gradients for Premium Look */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            </div>

            {/* Side Interaction Bar */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-30">
              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  aria-label="Like property"
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group"
                >
                  <Heart className="w-6 h-6 text-white group-active:fill-rose-500 group-active:text-rose-500 transition-colors" />
                </motion.button>
                <span className="text-[9px] font-black text-white/60">241</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => { setIsMuted(!isMuted); triggerHaptic('light'); }}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center"
                >
                  {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </motion.button>
                <span className="text-[9px] font-black text-white/60">{isMuted ? 'Muted' : 'Live'}</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  aria-label="Property info"
                  className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center"
                >
                  <Info className="w-6 h-6 text-primary" />
                </motion.button>
                <span className="text-[9px] font-black text-white/60">Details</span>
              </div>
            </div>

            {/* Bottom Info Card */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(1.5rem+var(--safe-bottom))] z-20">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={index === currentIndex ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4 max-w-[85%]"
              >
                <div className="flex flex-wrap gap-2">
                   <div className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">Featured Tour</span>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">{listing.category || 'Luxury'}</span>
                   </div>
                </div>

                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">
                  {listing.title}
                </h3>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-white/80">{listing.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-sm font-black text-white tracking-tight">${listing.price.toLocaleString()} {listing.currency || 'USD'}</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center justify-center gap-2 mt-4"
                >
                  View Property 
                  <Eye className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>

            {/* Interaction indicators */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
               {listings.slice(0, 10).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 rounded-full transition-all duration-300",
                      i === currentIndex ? "h-8 bg-primary" : "h-2 bg-white/20"
                    )}
                  />
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


