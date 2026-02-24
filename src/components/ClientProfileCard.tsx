import { useState, useRef, memo, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, X, MessageCircle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClientProfile } from '@/hooks/useClientProfiles';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useUserRatingAggregate } from '@/hooks/useRatingSystem';

// Tag categories for color coding
const PROPERTY_TAGS = [
  'Looking to rent long-term', 'Short-term rental seeker', 'Interested in purchasing property',
  'Open to rent-to-own', 'Flexible lease terms', 'Corporate housing needed',
  'Family-friendly housing', 'Student accommodation',
];

const TRANSPORTATION_TAGS = [
  'Need motorcycle rental', 'Looking to buy motorcycle', 'Bicycle enthusiast',
  'Need yacht charter', 'Interested in yacht purchase', 'Daily commuter', 'Weekend explorer',
];

const LIFESTYLE_TAGS = [
  'Pet-friendly required', 'Eco-conscious living', 'Digital nomad', 'Fitness & wellness focused',
  'Beach lover', 'City center preference', 'Quiet neighborhood', 'Social & community-oriented',
  'Work-from-home setup', 'Minimalist lifestyle',
];

const FINANCIAL_TAGS = [
  'Verified income', 'Excellent credit score', 'Landlord references available',
  'Long-term employment', 'Flexible budget',
];

interface ClientProfileCardProps {
  profile: ClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap: () => void;
  onInsights: () => void;
  onMessage: () => void;
  isTop: boolean;
  hasPremium: boolean;
}

const ClientProfileCardComponent = ({
  profile,
  onSwipe,
  onTap,
  onInsights,
  onMessage,
  isTop,
  hasPremium
}: ClientProfileCardProps) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [tapFlash, setTapFlash] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tapFlashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapFlashTimeoutRef.current) {
        clearTimeout(tapFlashTimeoutRef.current);
      }
    };
  }, []);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  // Fetch rating aggregate for this client profile
  const { data: ratingAggregate, isLoading: isRatingLoading } = useUserRatingAggregate(profile.user_id || String(profile.id));

  const images = profile.profile_images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setImageIndex((prev) => (prev + 1) % images.length);
    }
  }, [hasMultipleImages, images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [hasMultipleImages, images.length]);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;
    const threshold = rect.width * 0.3; // 30% of width for center area

    if (clickX < threshold) {
      prevImage(e);
    } else if (clickX > rect.width - threshold) {
      nextImage(e);
    } else {
      onTap();
    }
  }, [prevImage, nextImage, onTap]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;

    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const side = clickX < rect.width / 2 ? 'left' : 'right';

    setTapFlash(side);
    if (tapFlashTimeoutRef.current) {
      clearTimeout(tapFlashTimeoutRef.current);
    }
    tapFlashTimeoutRef.current = setTimeout(() => setTapFlash(null), 160);
  }, [isTop]);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 150; // Increased from 30-60px to 150px for proper snap-back
    const velocity = info.velocity.x;
    const absVelocity = Math.abs(velocity);

    // Check if drag distance OR velocity is enough for a swipe
    // Otherwise, spring animation will snap card back to center
    if (Math.abs(info.offset.x) > threshold || absVelocity > 500) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(direction);
    }
    // Card will automatically snap back if threshold not met
  }, [onSwipe]);

  const getSwipeIndicator = () => {
    return null; // Only show emoji after swipe
  };

  const cardStyle = {
    x,
    rotate: isTop ? rotate : 0,
    scale: 1,
    zIndex: 10,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    opacity: 1,
    filter: 'none',
    willChange: 'transform',
    transform: 'translateZ(0)'
  };

  return (
    <motion.div
      ref={cardRef}
      style={cardStyle}
      drag={isTop ? "x" : false}
      dragConstraints={isTop ? { left: 0, right: 0 } : { left: 0, right: 0 }}
      dragElastic={0.2}
      onPointerDown={handlePointerDown}
      onDragEnd={handleDragEnd}
      className={`transform-gpu ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none cursor-default'}`}
      whileHover={{ scale: isTop ? 1.01 : 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
    >
      <Card className="relative w-full h-[75vh] sm:h-[65vh] md:h-[600px] max-h-[750px] bg-white/95 border border-white/40 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm">

      {/* Swipe Indicator */}
      {getSwipeIndicator()}

      {/* Main Image - Responsive height for consistent card sizing */}
      <div className="relative h-[70%] overflow-hidden">
        {/* Tap Flash Overlay */}
        {tapFlash && (
          <motion.div
            className={`absolute inset-0 pointer-events-none z-10 ${
              tapFlash === 'right' 
                ? 'bg-emerald-500/30' 
                : 'bg-rose-500/30'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          />
        )}

        {images.length > 0 ? (
          <img
            src={images[imageIndex]}
            alt={profile.name}
            className="w-full h-full object-cover cursor-pointer"
            draggable={false}
            onClick={handleImageClick}
            loading="lazy"
            decoding="async"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
            onError={(e) => {
              e.currentTarget.src = '/placeholder-avatar.svg';
            }}
          />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center cursor-pointer relative overflow-hidden"
            onClick={handleImageClick}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="text-center relative z-10 px-8">
              <div className="w-32 h-32 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border-4 border-white/50">
                <img
                  src="/icons/icon.svg"
                  alt="Logo"
                  className="w-20 h-20"
                  draggable={false}
                />
              </div>
              <p className="text-white text-lg font-semibold mb-2">
                {profile.name || 'Client Profile'}
              </p>
              <p className="text-white/90 text-sm font-medium">
                Waiting for client to upload photos :)
              </p>
            </div>
          </div>
        )}
        
        {/* Left/Right Click Areas for Navigation */}
        <div className="absolute inset-0 flex">
          <div 
            className="w-1/3 h-full cursor-pointer opacity-0 hover:opacity-10 hover:bg-black transition-opacity"
            onClick={(e) => prevImage(e)}
          />
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={handleImageClick}
          />
          <div 
            className="w-1/3 h-full cursor-pointer opacity-0 hover:opacity-10 hover:bg-black transition-opacity"
            onClick={(e) => nextImage(e)}
          />
        </div>
        
        {/* Rating Display - Top Left Corner */}
        <div className="absolute top-6 left-4 z-30 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2">
          <CompactRatingDisplay
            aggregate={ratingAggregate}
            isLoading={isRatingLoading}
            showReviews={false}
            className="text-white"
          />
        </div>

        {/* Story-Style Image Dots */}
        {hasMultipleImages && (
          <div className="absolute top-6 right-4 z-30 flex gap-1.5 max-w-[40%]">
            {images.map((_, idx) => (
              <div
                key={`image-${idx}`}
                className="flex-1 h-1.5 rounded-full bg-white/40 backdrop-blur-sm overflow-hidden shadow-sm"
              >
                <div
                  className={`h-full bg-white shadow-lg transition-all duration-200 ${
                    idx === imageIndex ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>
      
      {/* Bottom Content - Modern Glass-morphism */}
      <div
        className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/25 via-black/15 to-transparent backdrop-blur-sm cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onTap();
        }}
      >
        <div className="space-y-3">
          {/* Name */}
          <div>
            <h3 className="text-2xl font-bold text-white drop-shadow-lg">{profile.name}</h3>
          </div>

          {/* Profile Tags with Modern Glass-morphism */}
          <div className="flex flex-wrap gap-2">
            {(() => {
              const allTags = [...(profile.interests || []), ...(profile.preferred_activities || [])];
              const defaultTags = allTags.length === 0 ? ['Digital Nomad', 'Professional', 'Verified Client'] : allTags;
              
              return defaultTags
                .slice(0, 4)
                .map((tag, index) => {
                  // Determine tag color based on category with glass-morphism
                  let badgeClass = "text-xs font-medium backdrop-blur-md border";
                  if (PROPERTY_TAGS.includes(tag)) {
                    badgeClass += " bg-blue-500/30 text-blue-100 border-blue-400/40";
                  } else if (TRANSPORTATION_TAGS.includes(tag)) {
                    badgeClass += " bg-red-500/30 text-red-100 border-red-400/40";
                  } else if (LIFESTYLE_TAGS.includes(tag)) {
                    badgeClass += " bg-purple-500/30 text-purple-100 border-purple-400/40";
                  } else if (FINANCIAL_TAGS.includes(tag)) {
                    badgeClass += " bg-green-500/30 text-green-100 border-green-400/40";
                  } else {
                    badgeClass += " bg-white/20 text-white border-white/40";
                  }

                  return (
                    <Badge key={`tag-${tag}`} variant="outline" className={`${badgeClass} px-3 py-1.5 rounded-lg`}>
                      {tag}
                    </Badge>
                  );
                });
            })()}
            {([...(profile.interests || []), ...(profile.preferred_activities || [])].length > 4) && (
              <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/40 backdrop-blur-md px-3 py-1.5 rounded-lg font-medium">
                +{[...(profile.interests || []), ...(profile.preferred_activities || [])].length - 4} more
              </Badge>
            )}
          </div>
        </div>
      </div>
      </Card>
    </motion.div>
  );
};

// Export memoized component for performance
export const ClientProfileCard = memo(ClientProfileCardComponent);
