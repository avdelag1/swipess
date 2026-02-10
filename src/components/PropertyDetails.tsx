
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
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;
      // Handle profiles as array or single object from join
      const result = data as any;
      if (result?.profiles && Array.isArray(result.profiles)) {
        result.profiles = result.profiles[0] || { full_name: '', avatar_url: '' };
      }
      return result as Listing & { profiles: { full_name: string; avatar_url: string } };
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
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
            
            {/* Full Screen Image Gallery */}
            <div 
              className="relative h-[60vh] overflow-hidden cursor-pointer group"
              onClick={() => handleImageClick(listing, 0)}
            >
              <img
                src={listing.images?.[0] || '/placeholder.svg'}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Image overlay with camera icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3">
                  <Camera className="w-6 h-6 text-gray-800" />
                </div>
              </div>
              
              {listing.images && listing.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-full text-sm backdrop-blur-sm">
                  1 / {listing.images.length}
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
              {/* Property Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{listing.title}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{listing.address}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {listing.neighborhood}, {listing.city}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">${listing.price?.toLocaleString()}</div>
                  <div className="text-muted-foreground">per month</div>
                  {listing.status && listing.status !== 'available' && (
                    <Badge
                      variant="outline"
                      className={`mt-2 ${
                        listing.status === 'rented'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : listing.status === 'sold'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}
                    >
                      {listing.status === 'rented' && '🏠 Rented Out'}
                      {listing.status === 'sold' && '💰 Sold'}
                      {listing.status === 'pending' && '⏳ Pending'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-3 gap-6">
                {listing.beds && (
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Bed className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-semibold">{listing.beds}</div>
                      <div className="text-sm text-muted-foreground">Bedroom{listing.beds !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )}
                {listing.baths && (
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Bath className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-semibold">{listing.baths}</div>
                      <div className="text-sm text-muted-foreground">Bathroom{listing.baths !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )}
                {listing.square_footage && (
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Square className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-semibold">{listing.square_footage}</div>
                      <div className="text-sm text-muted-foreground">Square ft</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">{listing.property_type}</Badge>
                {listing.furnished && <Badge variant="secondary" className="text-sm px-3 py-1">Furnished</Badge>}
                {listing.amenities?.map((amenity) => (
                  <Badge key={amenity} variant="outline" className="text-sm px-3 py-1">{amenity}</Badge>
                ))}
              </div>

              {/* Description */}
              {listing.description && (
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Description</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{listing.description}</p>
                </div>
              )}

              {/* Owner Info */}
              {listing.profiles && (
                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Listed by</h3>
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <img
                      src={listing.profiles.avatar_url || '/placeholder.svg'}
                      alt={listing.profiles.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-lg">{listing.profiles.full_name}</div>
                      <div className="text-muted-foreground">Property Owner</div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </ScrollArea>

            {/* Action Buttons - Fixed at bottom */}
            <div className="shrink-0 p-6 border-t bg-background/95 backdrop-blur-sm">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 h-12"
                  onClick={() => handleSwipe('left')}
                  disabled={swipeMutation.isPending}
                >
                  <X className="w-5 h-5" />
                  Pass
                </Button>
                
                {/* Check if direct messaging is available for this listing category */}
                {(() => {
                  const isDirectMessaging = isDirectMessagingListing(listing);
                  const canMessage = hasPremiumMessaging || isDirectMessaging;
                  return (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 h-12"
                      onClick={canMessage ? onMessageClick : () => {}}
                      disabled={!canMessage}
                    >
                      {isDirectMessaging && <Zap className="w-4 h-4 text-yellow-500" />}
                      <MessageCircle className="w-5 h-5" />
                      {isDirectMessaging ? 'Free Message' : (hasPremiumMessaging ? 'Message' : 'Premium Only')}
                    </Button>
                  );
                })()}
                
                <Button
                  className="flex-1 gap-2 h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                  onClick={() => handleSwipe('right')}
                  disabled={swipeMutation.isPending}
                >
                  <Flame className="w-5 h-5" />
                  Like
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
