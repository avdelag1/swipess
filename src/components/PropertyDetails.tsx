
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bath, Bed, Camera, Flame, MapPin, MessageCircle, Square, X, Zap } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';
import { useHasPremiumFeature } from '@/hooks/useSubscription';
import { Listing } from '@/hooks/useListings';
import { PropertyImageGallery } from './PropertyImageGallery';
import { isDirectMessagingListing } from '@/utils/directMessaging';

interface PropertyDetailsProps {
  listingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageClick: () => void;
}

export function PropertyDetails({ listingId, isOpen, onClose, onMessageClick }: PropertyDetailsProps) {
  const swipeMutation = useSwipe();
  const hasPremiumMessaging = useHasPremiumFeature('messaging');
  const [galleryState, setGalleryState] = useState<{
    isOpen: boolean;
    images: string[];
    alt: string;
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    alt: '',
    initialIndex: 0
  });

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;

      // Step 1: Fetch the listing
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Step 2: Fetch the owner profile separately (no FK constraint exists)
      let ownerProfile = null;
      if (data.owner_id) {
        const [{ data: ownerData }, { data: profileData }] = await Promise.all([
          supabase
            .from('owner_profiles')
            .select('business_name, profile_images')
            .eq('user_id', data.owner_id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', data.owner_id)
            .maybeSingle(),
        ]);

        const ownerImage = Array.isArray((ownerData as any)?.profile_images)
          ? (ownerData as any).profile_images.find((v: unknown): v is string => typeof v === 'string' && v.length > 0)
          : null;
        ownerProfile = {
          full_name: (ownerData as any)?.business_name || profileData?.full_name || '',
          avatar_url: ownerImage || profileData?.avatar_url || '',
        };
      }

      return { ...data, profiles: ownerProfile || { full_name: '', avatar_url: '' } } as Listing & { profiles: { full_name: string; avatar_url: string } };
    },
    enabled: !!listingId && isOpen,
  });

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!listingId) return;
    
    swipeMutation.mutate({
      targetId: listingId,
      direction,
      targetType: 'listing'
    });
    
    onClose();
  };

  const handleImageClick = (listing: any, imageIndex: number = 0) => {
    if (listing.images && listing.images.length > 0) {
      setGalleryState({
        isOpen: true,
        images: listing.images,
        alt: listing.title,
        initialIndex: imageIndex
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col p-0 transition-all duration-700 max-w-4xl h-[90vh]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ) : listing ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Property Details</DialogTitle>
            </DialogHeader>
            
            <div 
              className="relative overflow-hidden cursor-pointer group h-[60vh]"
              onClick={() => handleImageClick(listing, 0)}
            >
              <img
                src={listing.images?.[0] || '/placeholder.svg'}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Image overlay with camera icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="transition-opacity duration-300 rounded-full p-3 opacity-0 group-hover:opacity-100 bg-white/90">
                  <Camera className="w-6 h-6 text-gray-800" />
                </div>
              </div>
              
              {listing.images && listing.images.length > 1 && (
                <div className="absolute bottom-4 right-4 px-3 py-2 text-sm bg-black/70 text-white rounded-full backdrop-blur-sm">
                  1 / {listing.images.length}
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 overflow-y-auto p-6" style={{ overscrollBehavior: 'contain' }}>
              <div className="space-y-8">
              {/* Property Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="mb-2 text-3xl font-bold">{listing.title}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{listing.address}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {listing.neighborhood}, {listing.city}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black tracking-tighter leading-none text-3xl text-primary">${listing.price?.toLocaleString()}</div>
                  <div className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">per month</div>
                </div>
              </div>

              {/* Property Details Scroll */}
              <div className="flex overflow-x-auto pb-2 gap-3 snap-x scrollbar-none mask-fade-edges">
                {[
                  { icon: Bed, value: listing.beds, label: 'Beds' },
                  { icon: Bath, value: listing.baths, label: 'Baths' },
                  { icon: Square, value: listing.square_footage, label: 'Sq Ft' }
                ].map((item, i) => (
                  <div key={i} className="flex-shrink-0 flex items-center gap-4 p-4 px-6 transition-all bg-card/40 backdrop-blur-xl border border-white/5 shadow-lg rounded-[2rem] snap-start hover:bg-card/60">
                    <div className="p-2 bg-primary/20 rounded-full">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-black text-xl leading-none">{item.value}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-4 py-2">
                  {listing.property_type}
                </Badge>
                {listing.furnished && (
                  <Badge variant="secondary" className="px-4 py-2">
                    Furnished
                  </Badge>
                )}
                {listing.amenities?.map((amenity) => (
                  <Badge key={amenity} variant="outline" className="px-4 py-2">
                    {amenity}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              {listing.description && (
                <div className="space-y-3">
                  <h3 className="uppercase tracking-widest font-black text-xl font-semibold">About this sanctuary</h3>
                  <p className="leading-relaxed text-muted-foreground text-lg">{listing.description}</p>
                </div>
              )}

              {/* Owner Info */}
              {listing.profiles && (
                <div className="pt-10 pb-32 border-t border-border/50">
                  <h3 className="mb-4 font-black uppercase tracking-widest text-xl text-foreground">Authority Presence</h3>
                  <div className="flex items-center gap-6 p-6 transition-all bg-card/30 backdrop-blur-md border border-white/5 shadow-lg rounded-[2rem] hover:bg-card/50">
                    <img
                      src={listing.profiles.avatar_url || '/placeholder.svg'}
                      alt={listing.profiles.full_name}
                      className="object-cover w-16 h-16 rounded-full ring-2 ring-primary/20"
                    />
                    <div>
                      <div className="text-xl font-black uppercase italic leading-none text-foreground">
                        {listing.profiles.full_name}
                      </div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-primary mt-2">Certified Listing Authority</div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </ScrollArea>

            {/* Action Buttons - Floating Glass Pill */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50 pointer-events-none">
              <div className="flex gap-3 p-2 bg-background/50 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 h-14 rounded-full border-border dark:border-white/5 bg-secondary/50 dark:bg-white/5 hover:bg-secondary dark:hover:bg-white/10 hover:border-border dark:hover:border-white/10"
                  onClick={() => handleSwipe('left')}
                  disabled={swipeMutation.isPending}
                >
                  <X className="w-5 h-5" />
                  <span className="hidden sm:inline font-bold tracking-wide">Pass</span>
                </Button>
                
                {/* Check if direct messaging is available for this listing category */}
                {(() => {
                  const isDirectMessaging = isDirectMessagingListing(listing);
                  const canMessage = hasPremiumMessaging || isDirectMessaging;
                  return (
                    <Button
                      variant="outline"
                      className="flex-[1.5] gap-2 h-14 rounded-full border-border dark:border-white/5 bg-secondary/50 dark:bg-white/5 hover:bg-secondary dark:hover:bg-white/10 hover:border-border dark:hover:border-white/10"
                      onClick={canMessage ? onMessageClick : () => {}}
                      disabled={!canMessage}
                    >
                      {isDirectMessaging && <Zap className="w-4 h-4 text-amber-400" />}
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-bold tracking-wide">{isDirectMessaging ? 'Free Message' : (hasPremiumMessaging ? 'Message' : 'Locked')}</span>
                    </Button>
                  );
                })()}
                
                <Button
                  className="flex-1 gap-2 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:scale-[1.02] transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] text-white font-black uppercase italic tracking-widest border-none"
                  onClick={() => handleSwipe('right')}
                  disabled={swipeMutation.isPending}
                >
                  <Flame className="w-5 h-5" />
                  <span className="hidden sm:inline">Like</span>
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>

      <PropertyImageGallery
        images={galleryState.images}
        alt={galleryState.alt}
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState(prev => ({ ...prev, isOpen: false }))}
        initialIndex={galleryState.initialIndex}
      />
    </Dialog>
  );
}
