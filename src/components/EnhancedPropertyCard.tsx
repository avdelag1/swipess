import { useState, useRef, memo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, useAnimationControls } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Flame, X, Star, MapPin, Bed, Bath, Square, Wifi, Car,
  Camera, Eye, MessageCircle, ChevronLeft, ChevronRight,
  Home, TreePine, Utensils, Dumbbell, Music, Palette, PawPrint,
  ShieldCheck, CheckCircle
} from 'lucide-react';
import { Listing } from '@/hooks/useListings';
import { MatchedListing } from '@/hooks/useSmartMatching';
import { MatchPercentageBadge } from './MatchPercentageBadge';

interface EnhancedPropertyCardProps {
  listing: Listing | MatchedListing;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap?: () => void;
  onSuperLike?: () => void;
  onMessage?: () => void;
  isTop?: boolean;
  hasPremium?: boolean;
}

const getAmenityIcon = (amenity: string) => {
  const iconMap: { [key: string]: any } = {
    'wifi': Wifi,
    'parking': Car,
    'gym': Dumbbell,
    'pool': '🏊',
    'garden': TreePine,
    'kitchen': Utensils,
    'music': Music,
    'art': Palette,
    'pets': PawPrint,
    'rooftop': '🏙️',
    'fireplace': '🔥',
    'balcony': '🌅'
  };
  return iconMap[amenity.toLowerCase()] || Home;
};

const EnhancedPropertyCardComponent = ({
  listing,
  onSwipe,
  onTap,
  onSuperLike,
  onMessage,
  isTop = true,
  hasPremium = false
}: EnhancedPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);
  const controls = useAnimationControls();

  // Guard for missing images
  const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
  const images = imageCount > 0 ? listing.images : ['/placeholder.svg'];

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 120;
    const velocity = Math.abs(info.velocity.x);

    // If swipe is strong enough, complete it
    if (Math.abs(info.offset.x) > threshold || velocity > 700) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(direction);
    } else {
      // Spring back to center with animation
      controls.start({ x: 0, rotate: 0 });
    }
  }, [onSwipe, controls]);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imageCount > 1) {
      setCurrentImageIndex((prev) =>
        prev === imageCount - 1 ? 0 : prev + 1
      );
    }
  }, [imageCount]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imageCount > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? imageCount - 1 : prev - 1
      );
    }
  }, [imageCount]);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;
    const threshold = rect.width * 0.3; // 30% of width for center area

    if (clickX < threshold) {
      prevImage();
    } else if (clickX > rect.width - threshold) {
      nextImage();
    } else {
      onTap?.();
    }
  }, [prevImage, nextImage, onTap]);

  const getSwipeIndicator = () => {
    const xValue = x.get();
    if (xValue > 70) {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-red-500/10 backdrop-blur-[2px] rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="absolute top-1/3 text-white/80 font-bold text-3xl drop-shadow-2xl rotate-12">
            LIKE
          </div>
        </div>
      );
    } else if (xValue < -70) {
      return (
        <div className="absolute inset-0 bg-gray-600/10 backdrop-blur-[2px] rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="absolute top-1/3 text-white/80 font-bold text-3xl drop-shadow-2xl -rotate-12">
            NOPE
          </div>
        </div>
      );
    }
    return null;
  };

  const cardStyle = {
    x,
    rotate: isTop ? rotate : 0,
    scale: isTop ? scale : 0.95,
    zIndex: isTop ? 10 : 1,
    position: 'absolute' as const,
    top: isTop ? 0 : 8,
    left: isTop ? 0 : 4,
    right: isTop ? 0 : 4
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ ...cardStyle, willChange: 'transform' }}
      drag={isTop ? "x" : false}
      dragConstraints={isTop ? { left: -400, right: 400 } : { left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className="cursor-pointer transform-gpu w-full"
      whileHover={{ scale: isTop ? 1.01 : 0.95 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
    >
      <Card className="relative w-full h-[550px] overflow-hidden bg-white/95 border-white/40 shadow-2xl rounded-3xl backdrop-blur-sm">
        {/* Full Screen Image - Fixed height for consistent card sizing */}
        <div className="relative h-[430px] overflow-hidden">
          {imageCount > 0 ? (
            <>
              <img
                src={images[Math.min(currentImageIndex, imageCount - 1)]}
                alt={listing.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleImageClick}
                draggable={false}
                loading="lazy"
                decoding="async"
                style={{
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              
              {/* Quick Action - Message Icon in Top Right */}
              {onMessage && (
                <div className="absolute top-4 right-4 z-30">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessage();
                    }}
                    className="w-12 h-12 p-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white text-white hover:from-blue-600 hover:to-blue-700 shadow-[0_4px_12px_rgba(59,130,246,0.5)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-200"
                  >
                    <MessageCircle className="w-6 h-6 stroke-[2.5]" />
                  </Button>
                </div>
              )}
              
              {/* Left/Right Click Areas for Navigation */}
              <div className="absolute inset-0 flex">
                <div 
                  className="w-1/3 h-full cursor-pointer opacity-0 hover:opacity-10 hover:bg-black transition-opacity"
                  onClick={prevImage}
                />
                <div 
                  className="w-1/3 h-full cursor-pointer"
                  onClick={handleImageClick}
                />
                <div 
                  className="w-1/3 h-full cursor-pointer opacity-0 hover:opacity-10 hover:bg-black transition-opacity"
                  onClick={nextImage}
                />
              </div>

              {/* Story-Style Image Indicators */}
              {imageCount > 1 && (
                <div className="absolute top-6 left-0 right-0 z-30 flex justify-center gap-1.5 px-4">
                  {images.map((_, index) => (
                    <div
                      key={`image-${index}`}
                      className="flex-1 h-1.5 rounded-full bg-white/40 backdrop-blur-sm overflow-hidden shadow-sm"
                    >
                      <div
                        className={`h-full bg-white shadow-lg transition-all duration-200 ${
                          index === currentImageIndex ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Home className="w-20 h-20 text-muted-foreground" />
            </div>
          )}

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Bottom Content - Modern Glass-morphism */}
        <div
          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/25 via-black/15 to-transparent backdrop-blur-sm cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onTap?.();
          }}
        >
          <div className="flex justify-between items-end">
            {/* Left side - Title and Details */}
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                  {listing.title}
                </h3>
                {(listing as any).has_verified_documents && (
                  <Badge className="bg-blue-500/30 border-blue-400/40 text-blue-100 backdrop-blur-md flex items-center gap-1 px-2 py-0.5 rounded-lg">
                    {(listing as any).category === 'bicycle' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-xs font-medium">Verified</span>
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-white/90 text-sm mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{listing.neighborhood}, {listing.city}</span>
              </div>
              {/* Property details */}
              <div className="flex items-center space-x-4 text-sm text-white/80">
                {listing.beds && (
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    <span>{listing.beds} bed{listing.beds !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {listing.baths && (
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    <span>{listing.baths} bath{listing.baths !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {listing.square_footage && (
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    <span>{listing.square_footage} ft²</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Price */}
            <div className="text-right">
              <div className="text-3xl font-bold text-white drop-shadow-lg">
                ${listing.price?.toLocaleString()}
              </div>
              <div className="text-sm text-white/70">/month</div>
            </div>
          </div>
        </div>

        {/* Swipe Indicators */}
        {getSwipeIndicator()}
      </Card>
    </motion.div>
  );
};

// Export memoized component for performance
export const EnhancedPropertyCard = memo(EnhancedPropertyCardComponent);