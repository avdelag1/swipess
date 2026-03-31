/**
 * TINDER-STYLE SWIPE CARD
 *
 * Full diagonal movement with physics-based animations.
 * Card follows finger freely in any direction with natural rotation.
 * 
 * KEY FEATURES:
 * - Free XY movement (diagonal swipes)
 * - Rotation based on drag position (pivot from bottom)
 * - Spring physics for snap-back and exit
 * - Next card visible underneath with scale/opacity anticipation
 */

import { memo, useRef, useState, useCallback, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, animate, useDragControls, MotionValue } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { Listing } from '@/hooks/useListings';
import { MatchedListing } from '@/hooks/useSmartMatching';
import { useMagnifier } from '@/hooks/useMagnifier';
import { PropertyCardInfo, VehicleCardInfo, ServiceCardInfo } from '@/components/ui/CardInfoHierarchy';
import { VerifiedBadge } from '@/components/ui/TrustSignals';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useListingRatingAggregate } from '@/hooks/useRatingSystem';
import CardImage from '@/components/CardImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { SwipeMatchMeter } from '@/components/swipe/SwipeMatchMeter';

// Exposed interface for parent to trigger swipe animations
export interface SimpleSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

// Tinder-style thresholds
const SWIPE_THRESHOLD = 100; // Distance to trigger swipe
const VELOCITY_THRESHOLD = 400; // Velocity to trigger swipe
const FALLBACK_PLACEHOLDER = ''; // Empty → CardImage renders branded PlaceholderImage

// Max rotation angle (degrees) based on horizontal position
const MAX_ROTATION = 28; // Increased for a more playful, dramatic swing

// Calculate exit distance dynamically
const getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;

/**
 * SPRING CONFIGS - Tinder-tuned physics
 */
const SPRING_CONFIGS = {
  // SNAPPY: Quick response, minimal overshoot
  SNAPPY: { stiffness: 600, damping: 30, mass: 0.8 },
  // NATIVE: iOS-like balanced feel (DEFAULT)
  NATIVE: { stiffness: 400, damping: 28, mass: 1 },
  // SOFT: Playful with bounce - EXTREMELY FUN FEEL
  SOFT: { stiffness: 250, damping: 18, mass: 1.1 },
};

const ACTIVE_SPRING = SPRING_CONFIGS.NATIVE; // Responsive iOS-like feel without excessive bounce

interface SimpleSwipeCardProps {
  listing: Listing | MatchedListing;
  onSwipe: (direction: 'left' | 'right') => void;
  onInsights?: () => void;
  isTop?: boolean;
  /** Optional shared MotionValue from parent — lets container animate the card below in real-time */
  externalX?: MotionValue<number>;
  externalY?: MotionValue<number>;
}

const SimpleSwipeCardComponent = forwardRef<SimpleSwipeCardRef, SimpleSwipeCardProps>(({
  listing,
  onSwipe,
  onInsights,
  isTop = true,
  externalX,
  externalY,
}, ref) => {
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastListingIdRef = useRef(listing.id);
  const dragStartY = useRef(0);
  const dragControls = useDragControls();
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);

  // Motion values for BOTH X and Y - enables diagonal movement
  // Always create internal values (hooks must not be conditional)
  // Use external MotionValue if provided so the parent can observe drag position in real-time
  const _internalX = useMotionValue(0);
  const _internalY = useMotionValue(0);
  const x = externalX ?? _internalX;
  const y = externalY ?? _internalY;

  // Tinder-style rotation: pivots from bottom of card based on X drag
  // When you drag right, card rotates clockwise (positive rotation)
  // Rotation is proportional to X position, giving natural "pivot" feel
  const cardRotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);

  // Card opacity stays at 1 during drag for max smoothness (no compositing flicker)
  // Only fade slightly at extreme positions to hint at exit
  const cardOpacity = useTransform(
    x,
    [-300, -150, 0, 150, 300],
    [0.7, 1, 1, 1, 0.7]
  );

  // Like/Pass overlay opacity based on X position
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);

  // Image state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState<'left' | 'right'>('right');

  const images = useMemo(() => {
    let result: string[] = [];
    if (listing.video_url) {
      result.push('video_attachment');
    }
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      result = [...result, ...listing.images];
    } else if (listing.image_url) {
      result.push(listing.image_url);
    }

    if (result.length === 0) {
      return [FALLBACK_PLACEHOLDER];
    }
    return result;
  }, [listing.images, listing.image_url, listing.video_url]);

  const imageCount = images.length;
  const currentImage = images[currentImageIndex] || FALLBACK_PLACEHOLDER;

  // AGGRESSIVE PRELOAD: When this card is on top, preload ALL its images immediately
  // This ensures instant photo switching when user taps left/right
  useEffect(() => {
    if (!isTop || images.length <= 1) return;

    images.forEach((imageUrl) => {
      if (imageUrl && imageUrl !== FALLBACK_PLACEHOLDER && !imageCache.has(imageUrl)) {
        const img = new Image();
        img.onload = () => imageCache.set(imageUrl, true);
        img.src = getCardImageUrl(imageUrl);
      }
    });
  }, [isTop, images, listing.id]);

  // Reset state when listing changes - but ONLY if we're not mid-exit
  // This prevents the snap-back glitch caused by resetting during exit animation
  useEffect(() => {
    // Check if this is a genuine listing change (not a re-render during exit)
    if (listing.id !== lastListingIdRef.current) {
      lastListingIdRef.current = listing.id;

      // Only reset if we're not currently in an exit animation
      if (!isExitingRef.current) {
        hasExited.current = false;
        setCurrentImageIndex(0);
        x.set(0);
        y.set(0);
      }
    }
  }, [listing.id, x, y]);

  // Magnifier hook for press-and-hold zoom
  const { containerRef, pointerHandlers: magnifierPointerHandlers, isActive: isMagnifierActive } = useMagnifier({
    scale: 2.8, // Edge-to-edge zoom level
    holdDelay: 450,
    enabled: isTop,
  });

  // Fetch rating aggregate for this listing
  const { data: ratingAggregate, isLoading: isRatingLoading } = useListingRatingAggregate(listing.id, listing.category);

  // Unified pointer down handler: starts magnifier hold timer AND stores event for potential drag
  const handleUnifiedPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    dragStartedRef.current = false;
    storedPointerEventRef.current = e;
    // Start magnifier hold timer
    magnifierPointerHandlers.onPointerDown(e);
  }, [isTop, magnifierPointerHandlers]);

  // Unified pointer move: decides between magnifier pan vs starting drag
  const handleUnifiedPointerMove = useCallback((e: React.PointerEvent) => {
    if (isMagnifierActive()) {
      magnifierPointerHandlers.onPointerMove(e);
      return;
    }
    
    if (storedPointerEventRef.current && !dragStartedRef.current) {
      const dx = Math.abs(e.clientX - (storedPointerEventRef.current as any).clientX);
      const dy = Math.abs(e.clientY - (storedPointerEventRef.current as any).clientY);
      
      // Start drag only if we move more than a minor threshold
      if (dx > 5 || dy > 5) {
        dragStartedRef.current = true;
        dragControls.start(storedPointerEventRef.current);
        storedPointerEventRef.current = null;
      }
    }
  }, [isMagnifierActive, magnifierPointerHandlers, dragControls]);

  const handleUnifiedPointerUp = useCallback((e: React.PointerEvent) => {
    storedPointerEventRef.current = null;
    magnifierPointerHandlers.onPointerUp(e);
  }, [magnifierPointerHandlers]);

  const handleUnifiedPointerCancel = useCallback((e: React.PointerEvent) => {
    storedPointerEventRef.current = null;
    magnifierPointerHandlers.onPointerUp(e);
  }, [magnifierPointerHandlers]);

  const handleDragStart = useCallback((_: any, info: PanInfo) => {
    isDragging.current = true;
    dragStartY.current = info.point.y;
    triggerHaptic('light');
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const sweepX = info.offset.x;
    const velocityX = info.velocity.x;

    // Tinder-style threshold check (Distance OR Velocity)
    if (Math.abs(sweepX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD) {
      const direction = sweepX > 0 ? 'right' : 'left';
      hasExited.current = true;
      isExitingRef.current = true;
      
      triggerHaptic(direction === 'right' ? 'success' : 'warning');
      onSwipe(direction);
    } else {
      // Snap back to center
      animate(x, 0, {
        type: 'spring',
        ...ACTIVE_SPRING,
      });
      animate(y, 0, {
        type: 'spring',
        ...ACTIVE_SPRING,
      });
    }

    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  }, [onSwipe, x, y]);

  const handleCardTap = useCallback(() => {
    // Card tap does nothing by default
  }, []);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    if (isMagnifierActive()) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (imageCount > 1) {
      if (clickX < width * 0.33) {
        setPhotoDirection('left');
        setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
        triggerHaptic('light');
      }
      else if (clickX > width * 0.67) {
        setPhotoDirection('right');
        setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
        triggerHaptic('light');
      }
      else if (onInsights) {
        triggerHaptic('light');
        onInsights();
      }
    } else if (onInsights) {
      triggerHaptic('light');
      onInsights();
    }
  }, [imageCount, onInsights, isMagnifierActive]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    if (hasExited.current) return;
    hasExited.current = true;
    isExitingRef.current = true;

    triggerHaptic(direction === 'right' ? 'success' : 'warning');

    const exitX = direction === 'right' ? getExitDistance() : -getExitDistance();

    let swipeFired = false;
    const fireSwipe = () => {
      if (swipeFired) return;
      swipeFired = true;
      isExitingRef.current = false;
      onSwipe(direction);
    };

    animate(x, exitX, {
      type: 'tween',
      duration: 0.26,
      ease: [0.32, 0, 0.67, 0],
      onComplete: fireSwipe,
    });

    animate(y, direction === 'right' ? -60 : 32, {
      type: 'tween',
      duration: 0.26,
      ease: [0.32, 0, 0.67, 0],
    });

    setTimeout(fireSwipe, 300);
  }, [onSwipe, x, y]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          pointerEvents: 'none',
        }}
      >
        {currentImage === 'video_attachment' && listing.video_url ? (
          <video
            src={listing.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-[1]"
            style={{ pointerEvents: 'none', zIndex: 1 }}
          />
        ) : (
          <CardImage 
            src={currentImage} 
            alt={listing.title || 'Listing'} 
            name={listing.title} 
            direction={photoDirection} 
            priority={false} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardTap}
        onPointerDown={handleUnifiedPointerDown}
        onPointerMove={handleUnifiedPointerMove}
        onPointerUp={handleUnifiedPointerUp}
        onPointerCancel={handleUnifiedPointerCancel}
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative rounded-[32px] overflow-hidden shadow-2xl glass-nano-texture"
        style={{
          x,
          y,
          rotate: cardRotate,
          opacity: cardOpacity,
        }}
      >
        <div 
          ref={containerRef as any}
          className="absolute inset-0 overflow-hidden" 
          onClick={handleImageTap}
        >
          {currentImage === 'video_attachment' && listing.video_url ? (
            <video
              src={listing.video_url}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 1 }}
            />
          ) : (
            <CardImage 
              src={currentImage} 
              alt={listing.title || 'Listing'} 
              name={listing.title} 
              direction={photoDirection} 
              priority={isTop}
            />
          )}
          
          {imageCount > 1 && (
            <div className="absolute top-2 left-2 right-2 flex gap-[3px] z-20">
              {Array.from({ length: imageCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[3px] flex-1 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: idx === currentImageIndex
                      ? 'rgba(255, 255, 255, 0.95)'
                      : 'rgba(255, 255, 255, 0.35)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <motion.div
          className="absolute top-8 left-8 z-30 pointer-events-none"
          style={{
            opacity: likeOpacity,
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          <div
            className="px-6 py-3 rounded-xl border-4 border-rose-500 text-rose-500 font-black text-3xl tracking-wider"
            style={{
              transform: 'rotate(-12deg) translateZ(0)',
              backfaceVisibility: 'hidden',
              textShadow: '0 0 10px rgba(244, 63, 94, 0.6), 0 0 20px rgba(244, 63, 94, 0.4)',
            }}
          >
            YES!
          </div>
        </motion.div>

        <motion.div
          className="absolute top-8 right-8 z-30 pointer-events-none"
          style={{
            opacity: passOpacity,
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          <div
            className="px-6 py-3 rounded-xl border-4 border-red-500 text-red-500 font-black text-3xl tracking-wider"
            style={{
              transform: 'rotate(12deg) translateZ(0)',
              backfaceVisibility: 'hidden',
              textShadow: '0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.4)',
            }}
          >
            NOPE
          </div>
        </motion.div>

        <div
          className="absolute left-4 right-4 z-20 pointer-events-none p-5 rounded-[24px]"
          style={{ 
            bottom: 'clamp(130px, 22vh, 180px)',
            background: 'rgba(0,0,0,0.55)',
            boxShadow: 'var(--shadow-cinematic-md)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {'matchPercentage' in listing && (listing as MatchedListing).matchPercentage > 0 && (
              <SwipeMatchMeter
                percentage={(listing as MatchedListing).matchPercentage}
                reasons={(listing as MatchedListing).matchReasons}
                compact
              />
            )}
            <div
              className="inline-flex rounded-full px-3 py-1.5"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <CompactRatingDisplay
                aggregate={ratingAggregate as any}
                isLoading={isRatingLoading}
                showReviews={false}
                className="text-white"
              />
            </div>
          </div>
          {listing.category === 'vehicle' || listing.vehicle_type ? (
            <VehicleCardInfo
              price={listing.price || 0}
              priceType={listing.rental_duration_type === 'monthly' ? 'month' : 'day'}
              make={listing.vehicle_brand ?? undefined}
              model={listing.vehicle_model ?? undefined}
              year={listing.year ?? undefined}
              location={listing.city ?? undefined}
              isVerified={(listing as any).has_verified_documents ?? undefined}
              photoIndex={currentImageIndex}
            />
          ) : listing.category === 'worker' || listing.category === 'services' || (listing as any).service_category ? (
            <ServiceCardInfo
              hourlyRate={listing.price || 0}
              pricingUnit={(listing as any).pricing_unit || 'hr'}
              serviceName={(listing as any).service_category || listing.title || 'Service'}
              name={listing.title}
              location={listing.city ?? undefined}
              isVerified={(listing as any).has_verified_documents ?? undefined}
              photoIndex={currentImageIndex}
            />
          ) : (
            <PropertyCardInfo
              price={listing.price || 0}
              priceType={listing.rental_duration_type === 'monthly' ? 'month' : 'night'}
              propertyType={listing.property_type ?? undefined}
              beds={listing.beds ?? undefined}
              baths={listing.baths ?? undefined}
              location={listing.city ?? undefined}
              isVerified={(listing as any).has_verified_documents ?? undefined}
              photoIndex={currentImageIndex}
            />
          )}
        </div>

        {listing.has_verified_documents && (
          <div className="absolute top-16 right-4 z-20">
            <div className="px-2.5 py-1.5 rounded-full flex items-center gap-1.5" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}>
              <VerifiedBadge size="sm" />
              <span className="text-xs font-medium text-white">Verified</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
});

export const SimpleSwipeCard = memo(SimpleSwipeCardComponent);
