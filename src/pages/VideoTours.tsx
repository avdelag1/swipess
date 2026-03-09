import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, Volume2, VolumeX, MapPin, DollarSign, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoListing {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  images: any;
}

export default function VideoTours() {
  const [listings, setListings] = useState<VideoListing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVideoListings = async () => {
      // Fetch listings that have images (video support is optional)
      const { data } = await supabase
        .from('listings')
        .select('id, title, location, price, currency, images')
        .eq('is_active', true)
        .not('images', 'is', null)
        .limit(20);
      setListings((data || []) as VideoListing[]);
      setIsLoading(false);
    };
    fetchVideoListings();
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  }, [currentIndex]);

  const getImageUrl = (listing: VideoListing) => {
    if (Array.isArray(listing.images) && listing.images.length > 0) return listing.images[0];
    return '/placeholder.svg';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <Eye className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold text-foreground">No Tours Yet</h2>
        <p className="text-sm text-muted-foreground text-center">Property video tours will appear here as owners add them to their listings.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100dvh-80px)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
    >
      {listings.map((listing, index) => (
        <div key={listing.id} className="h-[calc(100dvh-80px)] snap-start relative overflow-hidden">
          {/* Background image (fallback for video) */}
          <div className="absolute inset-0">
            <img
              src={getImageUrl(listing)}
              alt={listing.title}
              className="w-full h-full object-cover"
              loading={index <= 1 ? 'eager' : 'lazy'}
            />
            {/* Cinematic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </div>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 z-10">
            <AnimatePresence>
              {index === currentIndex && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">{listing.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-white/70" />
                      <span className="text-sm text-white/80">{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-white/70" />
                      <span className="text-sm font-semibold text-white">${listing.price.toLocaleString()} {listing.currency || 'MXN'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Swipe up for next</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side controls */}
          <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-10">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          </div>

          {/* Progress dots */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
            {listings.slice(0, 8).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 rounded-full transition-all',
                  i === currentIndex ? 'h-6 bg-white' : 'h-1.5 bg-white/30'
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
