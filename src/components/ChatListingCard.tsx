import { memo, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BarChart3, Bookmark, Flag, MessageCircle, Share2 } from 'lucide-react';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useListingRatingAggregate } from '@/hooks/useRatingSystem';
import { PhotoPositionIndicators } from '@/components/swipe/PhotoPositionIndicators';
import { PropertyCardInfo, ServiceCardInfo, VehicleCardInfo } from '@/components/ui/CardInfoHierarchy';

interface ChatListingData {
  id: string;
  title?: string;
  price?: number;
  currency?: string;
  image?: string;
  images?: string[];
  city?: string;
  state?: string;
  bedrooms?: number;
  bathrooms?: number;
  listing_type?: string;
  property_type?: string;
  category?: string;
  has_verified_documents?: boolean;
  link?: string;
  url?: string;
  share_url?: string;
  description?: string;
  beds?: number;
  baths?: number;
  vehicle_brand?: string;
  vehicle_model?: string;
  year?: number;
  service_type?: string;
  name?: string;
}

interface ChatListingCardProps {
  listing: ChatListingData;
  isSwipess: boolean;
  onNavigate?: (path: string) => void;
  onMessage?: () => void;
  onInsights?: () => void;
  onSoon?: () => void;
  onShare?: () => void;
  onReport?: () => void;
}

export const ChatListingCard = memo(function ChatListingCard({
  listing,
  isSwipess,
  onNavigate,
  onMessage,
  onInsights,
  onSoon,
  onShare,
  onReport,
}: ChatListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState<'left' | 'right'>('right');

  const images = useMemo(() => {
    if (listing.images && listing.images.length > 0) return listing.images;
    if (listing.image) return [listing.image];
    return [];
  }, [listing.image, listing.images]);

  const imageCount = images.length;

  const currentImage = images[currentImageIndex] || '';

  const { data: ratingAggregate, isLoading: isRatingLoading } = useListingRatingAggregate(listing.id, listing.category);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (imageCount > 1 && clickX < width * 0.33) {
      setPhotoDirection('left');
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
    } else if (imageCount > 1 && clickX > width * 0.67) {
      setPhotoDirection('right');
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
    } else {
      const link = listing.link || listing.url || `/listing/${listing.id}`;
      onNavigate?.(link);
    }
  }, [imageCount, listing.id, listing.link, listing.url, onNavigate]);

  const navigateToListing = useCallback(() => {
    const link = listing.link || listing.url || `/listing/${listing.id}`;
    onNavigate?.(link);
  }, [listing.id, listing.link, listing.url, onNavigate]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] border text-left select-none",
        isSwipess ? "bg-white/[0.04] border-white/10" : "bg-card border-border/60"
      )}
      style={{
        boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.55)',
        aspectRatio: '3 / 4',
        minHeight: 380,
        maxHeight: 520,
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]" style={{ touchAction: 'none' }}>
        {currentImage ? (
          <img
            src={currentImage}
            alt={listing.title || 'Listing'}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
          style={{
            height: '42%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 80%, transparent 100%)',
          }}
        />

        {imageCount > 1 && (
          <PhotoPositionIndicators count={imageCount} currentIndex={currentImageIndex} />
        )}

        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={handleImageTap}
        />
      </div>

      <div
        className="absolute left-5 right-5 bottom-16 z-30 pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="glass-pill inline-flex px-3 py-1">
              <CompactRatingDisplay aggregate={ratingAggregate as any} isLoading={isRatingLoading} showReviews={false} className="text-white" />
            </div>
          </div>

          <div
            className="inline-flex flex-col w-fit max-w-full px-4 py-3 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.10)',
              backdropFilter: 'blur(28px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
            }}
          >
            {(() => {
              if (listing.category === 'vehicle') {
                return (
                  <VehicleCardInfo
                    title={listing.title}
                    price={listing.price || 0}
                    priceType={listing.listing_type === 'rental' ? 'month' : 'sale'}
                    make={listing.vehicle_brand}
                    model={listing.vehicle_model}
                    year={listing.year}
                    location={listing.city}
                    isVerified={listing.has_verified_documents}
                    photoIndex={currentImageIndex}
                    className="!text-white !space-y-0"
                  />
                );
              }
              if (listing.category === 'services' || listing.category === 'worker') {
                return (
                  <ServiceCardInfo
                    title={listing.title}
                    hourlyRate={listing.price || undefined}
                    serviceName={listing.service_type || listing.property_type || listing.title || 'Service'}
                    name={listing.name}
                    location={listing.city}
                    isVerified={listing.has_verified_documents}
                    photoIndex={currentImageIndex}
                    className="!text-white !space-y-0"
                  />
                );
              }
              return (
                <PropertyCardInfo
                  title={listing.title}
                  price={listing.price || 0}
                  priceType={listing.listing_type === 'rental' ? 'month' : 'sale'}
                  propertyType={listing.property_type}
                  beds={listing.beds ?? listing.bedrooms}
                  baths={listing.baths ?? listing.bathrooms}
                  location={listing.city}
                  isVerified={listing.has_verified_documents}
                  photoIndex={currentImageIndex}
                  className="!text-white !space-y-0"
                />
              );
            })()}
          </div>
        </motion.div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{
          height: '42%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.32) 35%, transparent 100%)',
        }}
      />

      {listing.has_verified_documents && (
        <div className="absolute top-16 left-6 z-40">
          <div className="glass-pill px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Verified</span>
          </div>
        </div>
      )}

      <div className="absolute right-3 bottom-20 z-50">
        <div
          className="flex flex-col gap-1.5 p-1.5 rounded-full"
          style={{
            background: 'rgba(20, 20, 24, 0.42)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 10px 30px -8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}
        >
          {[
            { icon: Share2, onClick: () => onShare?.(), label: 'Share' },
            { icon: Bookmark, onClick: () => onSoon?.(), label: 'Save' },
            { icon: MessageCircle, onClick: () => onMessage?.(), label: 'Message' },
            { icon: BarChart3, onClick: () => onInsights?.(), label: 'Insights' },
            { icon: Flag, onClick: () => onReport?.(), label: 'Report' },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                btn.onClick?.();
              }}
              aria-label={btn.label}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none p-0 outline-none"
              style={{
                background: 'transparent',
                border: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <btn.icon
                color="#FFFFFF"
                className="w-[18px] h-[18px]"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}
                strokeWidth={1.8}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
