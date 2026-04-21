import { memo } from 'react';
import CardImage from '@/components/CardImage';
import { Listing } from '@/hooks/useListings';
import { MatchedListing } from '@/hooks/useSmartMatching';

interface SwipeCardPeekProps {
  listing: Listing | MatchedListing;
}

export const SwipeCardPeek = memo(({ listing }: SwipeCardPeekProps) => {
  const currentImage = (Array.isArray(listing.images) && listing.images.length > 0) 
    ? listing.images[0] 
    : (listing.image_url || '');

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {listing.video_url ? (
        <video
          src={listing.video_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-[1]"
        />
      ) : (
        <CardImage 
          src={currentImage} 
          alt={listing.title || 'Listing'} 
          name={listing.title} 
          priority={false} 
        />
      )}
      
    </div>
  );
});

