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
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useListingRatingAggregate } from '@/hooks/useRatingSystem';
import CardImage from '@/components/CardImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { DiscoverySidebar } from '@/components/DiscoverySidebar';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { useDeviceParallax } from '@/hooks/useDeviceParallax';

// Exposed interface for parent to trigger swipe animations
export interface SimpleSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

// Tinder-style thresholds
const SWIPE_THRESHOLD = 65; // Distance to trigger swipe
const VELOCITY_THRESHOLD = 280; // Velocity to trigger swipe
const FALLBACK_PLACEHOLDER = ''; // Empty → CardImage renders branded PlaceholderImage

// Max rotation angle (degrees) based on horizontal position
const MAX_ROTATION = 18; // Elegant, less dramatic rotation

// Calculate exit distance dynamically
const getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;

/**
 * SPRING CONFIGS - Tinder-tuned physics
 */
const SPRING_CONFIGS = {
  // SNAPPY: Quick response, minimal overshoot
  SNAPPY: { stiffness: 600, damping: 30, mass: 0.8 },
  // HIGH-PERFORMANCE SILK: Hyper-responsive drag return
  SILK: { stiffness: 500, damping: 25, mass: 0.4 },
  // SOFT: Playful with bounce - EXTREMELY FUN FEEL
  SOFT: { stiffness: 250, damping: 18, mass: 1.1 },
};

const ACTIVE_SPRING = SPRING_CONFIGS.SILK; // Hyper-snappy iOS feel

/**
 * FAST GLASS SHINE ANIMATION
 * Creates a "moving reflection" that follows the user's drag, hardware accelerated.
 */
const GlassShine = ({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) => {
  const shineX = useTransform(x, [-300, 300], ['-50%', '150%']);
  const shineY = useTransform(y, [-300, 300], ['-50%', '150%']);
  const shineOpacity = useTransform(
    [x, y],
    ([latestX, latestY]: any) => {
      const distance = Math.sqrt(latestX ** 2 + latestY ** 2);
      return Math.min(0.4, distance / 400);
    }
  );

  return (
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
      style={{ opacity: shineOpacity }}
    >
      <motion.div
        className="absolute w-[200%] h-[200%] bg-gradient-radial from-white/30 via-transparent to-transparent"
        style={{
          x: shineX,
          y: shineY,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </motion.div>
  );
};

interface SimpleSwipeCardProps {
  listing: Listing | MatchedListing;
  onSwipe: (direction: 'left' | 'right') => void;
  onInsights?: () => void;
  onShare?: () => void;
  onMessage?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  isTop?: boolean;
  /** Optional shared MotionValue from parent — lets container animate the card below in real-time */
  externalX?: MotionValue<number>;
  externalY?: MotionValue<number>;
  /** Called when drag gesture starts — lets parent kick off N+2 image preload */
  onDragStart?: () => void;
}

const SimpleSwipeCardComponent = forwardRef<SimpleSwipeCardRef, SimpleSwipeCardProps>(({
  listing,
  onSwipe,
  onInsights,
  onShare,
  onMessage,
  onLike,
  onDislike,
  isTop = true,
  externalX,
  externalY,
  onDragStart,
}, ref) => {
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastListingIdRef = useRef(listing.id);
  const dragStartY = useRef(0);
  const dragControls = useDragControls();
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);
  const { undoLastSwipe, canUndo } = useSwipeUndo();

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

  // 🚀 FLAGSHIP FEATURE: 3D Perspective Tilt based on pointer pos & Device Gyroscope
  const pointerRotateX = useMotionValue(0);
  const pointerRotateY = useMotionValue(0);
  const { tiltX: gyroTiltX, tiltY: gyroTiltY } = useDeviceParallax(0.4);

  const rotateX = useTransform(pointerRotateX, (val) => val - gyroTiltY);
  const rotateY = useTransform(pointerRotateY, (val) => val + gyroTiltX);

  const containerRectRef = useRef<DOMRect | null>(null);

  const handlePointerMoveForTilt = useCallback((e: React.PointerEvent) => {
    if (!isTop || isDragging.current) return;
    
    // PERF: Retrieve rect once and cache it to avoid forced reflow (1.3ms savings per move)
    if (!containerRectRef.current) {
      containerRectRef.current = e.currentTarget.getBoundingClientRect();
    }
    const rect = containerRectRef.current;
    
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate relative offset (-1 to 1)
    const rotateYVal = ((xPos - centerX) / centerX) * 8; // Max 8 deg tilt
    const rotateXVal = ((centerY - yPos) / centerY) * 8; // Max 8 deg tilt

    pointerRotateY.set(rotateYVal);
    pointerRotateX.set(rotateXVal);
  }, [isTop, pointerRotateX, pointerRotateY]);

  const handlePointerLeaveForTilt = useCallback(() => {
    containerRectRef.current = null; // Clear cache on leave
    animate(pointerRotateX, 0, { duration: 0.5 });
    animate(pointerRotateY, 0, { duration: 0.5 });
  }, [pointerRotateX, pointerRotateY]);

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
    // Reset pointer tilt so the drag rotation isn't added on top of a stale tilt.
    pointerRotateX.set(0);
    pointerRotateY.set(0);
    triggerHaptic('light');
    onDragStart?.();
  }, [onDragStart, pointerRotateX, pointerRotateY]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const sweepX = info.offset.x;
    const sweepY = info.offset.y;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;

    // 🏎️ MULTI-DIMENSIONAL SWIPE: L/R for High Intent, UP for Fast Pass
    const isHorizontalSwipe = Math.abs(sweepX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD;
    const isVerticalUpSwipe = sweepY < -SWIPE_THRESHOLD || velocityY < -VELOCITY_THRESHOLD;

    if (isHorizontalSwipe) {
      const direction = sweepX > 0 ? 'right' : 'left';
      hasExited.current = true;
      isExitingRef.current = true;
      triggerHaptic(direction === 'right' ? 'success' : 'warning');
      onSwipe(direction);
    } else if (isVerticalUpSwipe) {
      // 🚀 FAST PASS (FLICK UP)
      hasExited.current = true;
      isExitingRef.current = true;
      triggerHaptic('light');
      onSwipe('left'); // Flick Up = Pass
    } else {
      // Snap back to center
      animate(x, 0, { type: 'spring', ...ACTIVE_SPRING });
      animate(y, 0, { type: 'spring', ...ACTIVE_SPRING });
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
    const _exitY = direction === 'left' && !isDragging.current ? -getExitDistance() : 0; // Vertical lift for passes

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
        className="absolute inset-x-2 bottom-4 top-4 rounded-[32px] overflow-hidden shadow-sm"
        style={{
          pointerEvents: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {currentImage === 'video_attachment' && listing.video_url ? (
          <video
            src={listing.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-[1] opacity-60"
            style={{ pointerEvents: 'none', zIndex: 1 }}
          />
        ) : (
          <div className="absolute inset-0 opacity-60">
            <CardImage 
              src={currentImage} 
              alt={listing.title || 'Listing'} 
              name={listing.title} 
              direction={photoDirection} 
              priority={false} 
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.55}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardTap}
        onPointerDown={handleUnifiedPointerDown}
        onPointerMove={(e) => {
          handleUnifiedPointerMove(e);
          handlePointerMoveForTilt(e);
        }}
        onPointerLeave={handlePointerLeaveForTilt}
        onPointerUp={(e) => {
          handleUnifiedPointerUp(e);
          handlePointerLeaveForTilt();
        }}
        onPointerCancel={(e) => {
          handleUnifiedPointerCancel(e);
          handlePointerLeaveForTilt();
        }}
        initial={{ scale: 0.97, opacity: 0.85 }}
        animate={{ 
          scale: 1,
          opacity: 1,
          transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 }
        }}
        // Photo swim effect now lives on the <img> inside CardImage (CSS keyframes)
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),0_16px_32px_-8px_rgba(0,0,0,0.3)] glass-nano-texture pointer-events-auto border border-white/10 zenith-interaction-isolation gpu-ultra"
        style={{
          x,
          y,
          rotate: cardRotate,
          rotateX,
          rotateY,
          opacity: cardOpacity,
          willChange: 'transform, opacity',
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          transform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'rgba(255, 255, 255, 0.01)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <GlassShine x={x} y={y} />
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
            <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-20">
              {Array.from({ length: imageCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[2px] flex-1 rounded-full transition-all duration-500 overflow-hidden bg-white/20"
                >
                  <motion.div 
                    initial={false}
                    animate={{ 
                      x: idx < currentImageIndex ? '0%' : idx === currentImageIndex ? '0%' : '-100%',
                      opacity: idx === currentImageIndex ? 1 : 0.5
                    }}
                    className="w-full h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  />
                </div>
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
              transform: 'rotate(-12deg) translateZ(0)', // GPU Composite
              backfaceVisibility: 'hidden',
              textShadow: '0 0 10px rgba(244, 63, 94, 0.6), 0 0 20px rgba(244, 63, 94, 0.4)',
              willChange: 'opacity, transform',
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
              transform: 'rotate(12deg) translateZ(0)', // GPU Composite
              backfaceVisibility: 'hidden',
              textShadow: '0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.4)',
              willChange: 'opacity, transform',
            }}
          >
            NOPE
          </div>
        </motion.div>

        {/* 🚀 PREMIUM INFUSION: Dissolving Info Overlay in bottom-left */}
        <div
          key={`info-${currentImageIndex % 4}`}
          className="absolute left-6 bottom-24 z-30 pointer-events-none max-w-[80%]"
          style={{ 
            contain: 'layout paint',
            transform: 'translateZ(0)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="inline-flex rounded-full px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 shadow-lg"
              >
                <CompactRatingDisplay
                  aggregate={ratingAggregate as any}
                  isLoading={isRatingLoading}
                  showReviews={false}
                  className="text-white"
                />
              </div>
              {listing.has_verified_documents && (
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Elite</span>
                </div>
              )}
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
                className="!text-white !space-y-0"
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
                className="!text-white !space-y-0"
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
                className="!text-white !space-y-0"
              />
            )}
          </motion.div>
        </div>

        {/* Global Dark Gradient for contrast */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)'
          }}
        />

        {/* 🏎️ DISCOVERY REEL SIDEBAR — Social-Media Standard */}
        {isTop && (
          <DiscoverySidebar
            onUndo={undoLastSwipe}
            onMessage={onMessage}
            onShare={onShare}
            onInsights={onInsights}
            onLike={onLike}
            onDislike={onDislike}
            canUndo={canUndo}
            matchPercentage={'matchPercentage' in listing ? (listing as MatchedListing).matchPercentage : undefined}
          />
        )}

        {/* Verified Badge - Left corner higher up */}
        {listing.has_verified_documents && (
          <div className="absolute top-16 left-6 z-40">
             <div className="relative px-3 py-1.5 rounded-full flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">
                 Verified
               </span>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
});

export const SimpleSwipeCard = memo(SimpleSwipeCardComponent);
