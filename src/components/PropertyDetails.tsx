
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Bed, Bath, Square, Flame, MessageCircle, X, Camera, Zap } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';
import { useHasPremiumFeature } from '@/hooks/useSubscription';
import { Listing } from '@/hooks/useListings';
import { PropertyImageGallery } from './PropertyImageGallery';
import { isDirectMessagingListing } from '@/utils/directMessaging';
import { useTheme } from '@/hooks/useTheme';

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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', data.owner_id)
          .maybeSingle();
        ownerProfile = profileData;
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

              {/* Property Details Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Bed, value: listing.beds, label: 'Beds' },
                  { icon: Bath, value: listing.baths, label: 'Baths' },
                  { icon: Square, value: listing.square_footage, label: 'Sq Ft' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-4 transition-all hover:scale-105 bg-muted/30 rounded-lg">
                    <item.icon className="w-6 h-6 mb-2 text-primary" />
                    <div className="font-black text-xl leading-none">{item.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-secondary">
                  {listing.property_type}
                </Badge>
                {listing.furnished && (
                  <Badge className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-secondary">
                    Furnished
                  </Badge>
                )}
                {listing.amenities?.map((amenity) => (
                  <Badge key={amenity} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 variant-outline">
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
                <div className="pt-10 border-t">
                  <h3 className="mb-4 font-black uppercase tracking-widest text-xl font-semibold">Authority Presence</h3>
                  <div className="flex items-center gap-6 p-6 transition-all bg-muted/30 rounded-lg">
                    <img
                      src={listing.profiles.avatar_url || '/placeholder.svg'}
                      alt={listing.profiles.full_name}
                      className="object-cover w-16 h-16 rounded-full"
                    />
                    <div>
                      <div className="text-xl font-black uppercase italic leading-none">
                        {listing.profiles.full_name}
                      </div>
                      <div className="text-[11px] font-black uppercase tracking-widest opacity-40 mt-1">Certified Listing Authority</div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </ScrollArea>

            {/* Action Buttons - Fixed at bottom */}
            <div className="shrink-0 p-8 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] border-t bg-background/95 backdrop-blur-sm">
              <div className="flex gap-4 max-w-screen-md mx-auto">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 h-16"
                  onClick={() => handleSwipe('left')}
                  disabled={swipeMutation.isPending}
                >
                  <X className="w-6 h-6" />
                  <span className="hidden sm:inline">Pass</span>
                </Button>
                
                {/* Check if direct messaging is available for this listing category */}
                {(() => {
                  const isDirectMessaging = isDirectMessagingListing(listing);
                  const canMessage = hasPremiumMessaging || isDirectMessaging;
                  return (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 h-16"
                      onClick={canMessage ? onMessageClick : () => {}}
                      disabled={!canMessage}
                    >
                      {isDirectMessaging && <Zap className="w-4 h-4 text-amber-400" />}
                      <MessageCircle className="w-6 h-6" />
                      <span className="hidden sm:inline">{isDirectMessaging ? 'Free Message' : (hasPremiumMessaging ? 'Message' : 'Locked')}</span>
                    </Button>
                  );
                })()}
                
                <Button
                  className="flex-1 gap-2 h-16 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                  onClick={() => handleSwipe('right')}
                  disabled={swipeMutation.isPending}
                >
                  <Flame className="w-6 h-6" />
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


