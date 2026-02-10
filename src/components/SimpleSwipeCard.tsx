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
import { motion, useMotionValue, useTransform, PanInfo, animate, useSpring } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { Listing } from '@/hooks/useListings';
import { MatchedListing } from '@/hooks/useSmartMatching';
import { useMagnifier } from '@/hooks/useMagnifier';
import { PropertyCardInfo, VehicleCardInfo, ServiceCardInfo } from '@/components/ui/CardInfoHierarchy';
import { VerifiedBadge } from '@/components/ui/TrustSignals';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useListingRatingAggregate } from '@/hooks/useRatingSystem';
import { GradientMaskTop, GradientMaskBottom } from '@/components/ui/GradientMasks';
import { useParallaxStore } from '@/state/parallaxStore';
import CardImage from '@/components/CardImage';
import { imageCache } from '@/lib/swipe/cardImageCache';

// Exposed interface for parent to trigger swipe animations
export interface SimpleSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

// Tinder-style thresholds
const SWIPE_THRESHOLD = 100; // Distance to trigger swipe
const VELOCITY_THRESHOLD = 400; // Velocity to trigger swipe
const FALLBACK_PLACEHOLDER = '/placeholder.svg';

// Max rotation angle (degrees) based on horizontal position
const MAX_ROTATION = 12;

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
  // SOFT: Playful with bounce
  SOFT: { stiffness: 300, damping: 22, mass: 1.2 },
};

const ACTIVE_SPRING = SPRING_CONFIGS.NATIVE;

interface SimpleSwipeCardProps {
  listing: Listing | MatchedListing;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap?: () => void;
  onInsights?: () => void;
  isTop?: boolean;
}

const SimpleSwipeCardComponent = forwardRef<SimpleSwipeCardRef, SimpleSwipeCardProps>(({
  listing,
  onSwipe,
  onTap,
  onInsights,
  isTop = true,
}, ref) => {
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastListingIdRef = useRef(listing.id);
  const dragStartY = useRef(0);

  // Motion values for BOTH X and Y - enables diagonal movement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Tinder-style rotation: pivots from bottom of card based on X drag
  // When you drag right, card rotates clockwise (positive rotation)
  // Rotation is proportional to X position, giving natural "pivot" feel
  const cardRotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);

  // Card opacity decreases as it moves away from center
  const cardOpacity = useTransform(
    x,
    [-300, -100, 0, 100, 300],
    [0.6, 0.9, 1, 0.9, 0.6]
  );

  // Like/Pass overlay opacity based on X position
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);

  // No blur effect - clean swipe without filter overhead

  // Image state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = useMemo(() => {
    return Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : [FALLBACK_PLACEHOLDER];
  }, [listing.images]);

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

  // Magnifier hook for press-and-hold zoom - MUST be called before any callbacks that use it
  // FULL-IMAGE ZOOM: Entire image zooms on press-and-hold, no lens/clipping
  const { containerRef, pointerHandlers, isActive: isMagnifierActive } = useMagnifier({
    scale: 2.5, // Full-image zoom level (2.5 = 250%)
    holdDelay: 300, // Fast activation for instant feel
    enabled: isTop,
  });

  // Fetch rating aggregate for this listing
  const categoryId = listing.category === 'vehicle' || listing.vehicle_type ? 'vehicle' : 'property';
  const { data: ratingAggregate, isLoading: isRatingLoading } = useListingRatingAggregate(listing.id, categoryId);

  // Parallax store for ambient background effect
  const updateParallaxDrag = useParallaxStore((s) => s.updateDrag);
  const endParallaxDrag = useParallaxStore((s) => s.endDrag);

  // Subscribe motion value to parallax store for ambient background effect
  useEffect(() => {
    const unsubscribe = x.on('change', (latestX) => {
      if (isDragging.current && isTop) {
        updateParallaxDrag(latestX, 0, x.getVelocity());
      }
    });
    return unsubscribe;
  }, [x, isTop, updateParallaxDrag]);

  const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = true;
    dragStartY.current = info.point.y;
    triggerHaptic('light');
  }, []);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    endParallaxDrag();
    
    if (hasExited.current) return;

    const offsetX = info.offset.x;
    const offsetY = info.offset.y;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;

    // Swipe threshold based on X distance or velocity
    const shouldSwipe = Math.abs(offsetX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD;

    if (shouldSwipe) {
      hasExited.current = true;
      isExitingRef.current = true;
      const direction = offsetX > 0 ? 'right' : 'left';

      triggerHaptic(direction === 'right' ? 'success' : 'warning');

      // Exit in the SAME direction of the swipe gesture (diagonal physics)
      const exitDistance = getExitDistance();
      const exitX = direction === 'right' ? exitDistance : -exitDistance;
      
      // Calculate Y exit based on swipe angle - maintains diagonal trajectory
      const swipeAngle = Math.atan2(offsetY, Math.abs(offsetX));
      const exitY = Math.tan(swipeAngle) * exitDistance * (offsetY > 0 ? 1 : 1);

      // Spring-based exit animation - feels more natural than tween
      animate(x, exitX, {
        type: 'spring',
        stiffness: 600,
        damping: 30,
        velocity: velocityX,
        onComplete: () => {
          isExitingRef.current = false;
          onSwipe(direction);
        },
      });
      
      // Animate Y in parallel
      animate(y, Math.min(Math.max(exitY, -300), 300), {
        type: 'spring',
        stiffness: 600,
        damping: 30,
        velocity: velocityY,
      });
    } else {
      // Spring snap-back to center - BOTH X and Y
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
  }, [listing.id, onSwipe, x, y, endParallaxDrag]);

  const handleCardTap = useCallback(() => {
    // Card tap does nothing by default - image taps handle photo navigation
    // This prevents conflict with handleImageTap
  }, []);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    // Don't handle tap if magnifier is active - allows zoom to work
    if (isMagnifierActive()) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // Left third - previous image (only if multiple images)
    if (clickX < width * 0.33 && imageCount > 1) {
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
      triggerHaptic('light');
    }
    // Right third - next image (only if multiple images)
    else if (clickX > width * 0.67 && imageCount > 1) {
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
      triggerHaptic('light');
    }
    // Middle area - open insights (only if not magnifier and user tapped middle)
    else if (onInsights && clickX >= width * 0.33 && clickX <= width * 0.67) {
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

    // Spring-based exit for button taps (consistent physics)
    animate(x, exitX, {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      onComplete: () => {
        isExitingRef.current = false;
        onSwipe(direction);
      },
    });
    
    // Slight upward arc for button swipes
    animate(y, -50, {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    });
  }, [listing.id, onSwipe, x, y]);

  // Expose triggerSwipe method to parent via ref
  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  // Format price
  // Format price - moved before conditional render to avoid hook order issues
  const rentalType = (listing as any).rental_duration_type;
  const formattedPrice = listing.price
    ? `$${listing.price.toLocaleString()}${rentalType === 'monthly' ? '/mo' : rentalType === 'daily' ? '/day' : ''}`
    : null;

  // Render based on position - all hooks called above regardless of render path
  if (!isTop) {
    // Non-top card: simple static preview (no interaction, just visual)
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          pointerEvents: 'none',
        }}
      >
        <CardImage src={currentImage} alt={listing.title || 'Listing'} />
        {/* Bottom gradient for depth */}
        <GradientMaskBottom intensity={0.6} zIndex={2} heightPercent={40} />
      </div>
    );
  }


  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Draggable Card - FREE XY MOVEMENT (Tinder-style diagonal) */}
      <motion.div
        drag={!isMagnifierActive()}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardTap}
        style={{
          x,
          y,
          rotate: cardRotate,
          opacity: cardOpacity,
          transformOrigin: 'bottom center',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
        } as any}
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative rounded-[24px] overflow-hidden shadow-xl"
      >
        {/* Image area - FULL VIEWPORT with magnifier support */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full overflow-hidden rounded-[24px]"
          onClick={handleImageTap}
          {...pointerHandlers}
          style={{
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          {/* PHOTO - LOWEST LAYER (z-index: 1) - 100% viewport coverage */}
          <CardImage src={currentImage} alt={listing.title || 'Listing'} />

          {/* TOP GRADIENT MASK - Creates visual contrast for header UI */}
          <GradientMaskTop intensity={1} zIndex={15} heightPercent={28} />

          {/* Image dots - Positioned below header area */}
          {imageCount > 1 && (
            <div className="absolute top-16 left-4 right-4 z-25 flex gap-1" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1 rounded-full transition-all duration-200 ${idx === currentImageIndex ? 'bg-white shadow-sm' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}

          {/* BOTTOM GRADIENT MASK - Creates visual contrast for buttons & info */}
          <GradientMaskBottom intensity={1} zIndex={18} heightPercent={55} />
        </div>
        
        {/* YES! overlay */}
        <motion.div
          className="absolute top-8 left-8 z-30 pointer-events-none"
          style={{
            opacity: likeOpacity,
            willChange: 'opacity',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          <div
            className="px-6 py-3 rounded-xl border-4 border-green-500 text-green-500 font-black text-3xl tracking-wider"
            style={{
              transform: 'rotate(-12deg) translateZ(0)',
              backfaceVisibility: 'hidden',
              textShadow: '0 0 10px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.4)',
            }}
          >
            YES!
          </div>
        </motion.div>

        {/* NOPE overlay */}
        <motion.div
          className="absolute top-8 right-8 z-30 pointer-events-none"
          style={{
            opacity: passOpacity,
            willChange: 'opacity',
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
        
        {/* Content overlay - Using CardInfoHierarchy for 2-second scanning */}
        <div className="absolute bottom-24 left-0 right-0 p-4 z-20 pointer-events-none">
          {/* Rating Display - Bottom of card, above property info */}
          <div className="mb-3">
            <div className="inline-flex bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <CompactRatingDisplay
                aggregate={ratingAggregate}
                isLoading={isRatingLoading}
                showReviews={false}
                className="text-white"
              />
            </div>
          </div>
          {/* Determine card type and render appropriate info hierarchy */}
          {listing.category === 'vehicle' || listing.vehicle_type ? (
            <VehicleCardInfo
              price={listing.price || 0}
              priceType={(listing as any).rental_duration_type === 'monthly' ? 'month' : 'day'}
              make={(listing as any).vehicle_brand}
              model={(listing as any).vehicle_model}
              year={listing.year}
              location={listing.city}
              isVerified={(listing as any).has_verified_documents}
              photoIndex={currentImageIndex}
            />
          ) : listing.category === 'worker' || listing.category === 'services' || (listing as any).service_type ? (
            <ServiceCardInfo
              hourlyRate={(listing as any).hourly_rate}
              serviceName={(listing as any).service_type || listing.title || 'Service'}
              name={(listing as any).provider_name}
              location={listing.city}
              isVerified={(listing as any).has_verified_documents}
              photoIndex={currentImageIndex}
            />
          ) : (
            <PropertyCardInfo
              price={listing.price || 0}
              priceType={(listing as any).rental_duration_type === 'monthly' ? 'month' : 'night'}
              propertyType={listing.property_type}
              beds={listing.beds}
              baths={listing.baths}
              location={listing.city}
              isVerified={(listing as any).has_verified_documents}
              photoIndex={currentImageIndex}
            />
          )}
        </div>
        
        {/* Verified badge - now using TrustSignals component */}
        {(listing as any).has_verified_documents && (
          <div className="absolute top-16 right-4 z-20">
            <div className="px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5">
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
