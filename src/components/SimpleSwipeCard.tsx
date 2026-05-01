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
import { MatchedListing, MatchedClientProfile } from '@/hooks/useSmartMatching';
import { useMagnifier } from '@/hooks/useMagnifier';
import { PropertyCardInfo, VehicleCardInfo, ServiceCardInfo, ClientCardInfo } from '@/components/ui/CardInfoHierarchy';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useListingRatingAggregate } from '@/hooks/useRatingSystem';
import CardImage from '@/components/CardImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { useDeviceParallax } from '@/hooks/useDeviceParallax';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { Flag, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';

// Exposed interface for parent to trigger swipe animations
export interface SimpleSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

// Tinder-style thresholds
const SWIPE_THRESHOLD = 65; // Distance to trigger swipe
const VELOCITY_THRESHOLD = 280; // Velocity to trigger swipe
const FALLBACK_PLACEHOLDER = ''; // Empty → CardImage renders branded PlaceholderImage

// Max rotation angle (degrees) based on horizontal position
const MAX_ROTATION = 14; // Even smoother, more premium pivot

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
  listing: Listing | MatchedListing | MatchedClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onInsights?: () => void;
  isTop?: boolean;
  /** Optional shared MotionValue from parent — lets container animate the card below in real-time */
  externalX?: MotionValue<number>;
  externalY?: MotionValue<number>;
  /** Called when drag gesture starts — lets parent kick off N+2 image preload */
  onDragStart?: () => void;
  onShare?: () => void;
  onReport?: () => void;
}

const SimpleSwipeCardComponent = forwardRef<SimpleSwipeCardRef, SimpleSwipeCardProps>(({
  listing,
  onSwipe,
  onInsights,
  isTop = true,
  externalX,
  externalY,
  onDragStart,
  onShare,
  onReport,
}, ref) => {
  const { isLight } = useAppTheme();
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastListingIdRef = useRef(listing.id || (listing as any).user_id);
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
    
    // Check if it's a profile or a listing
    const isProfile = (listing as any).profile_images || (listing as any).name;
    
    if (isProfile) {
      if (Array.isArray((listing as any).profile_images) && (listing as any).profile_images.length > 0) {
        result = (listing as any).profile_images;
      } else if ((listing as any).avatar_url) {
        result = [(listing as any).avatar_url];
      }
    } else {
      if ((listing as any).video_url) {
        result.push((listing as any).video_url);
      }
      if (Array.isArray((listing as any).images) && (listing as any).images.length > 0) {
        result = [...result, ...(listing as any).images];
      } else if ((listing as any).image_url) {
        result.push((listing as any).image_url);
      }
    }

    if (result.length === 0) {
      return [FALLBACK_PLACEHOLDER];
    }
    return result;
  }, [listing]);

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
    const currentId = listing.id || (listing as any).user_id;
    // Check if this is a genuine listing change (not a re-render during exit)
    if (currentId !== lastListingIdRef.current) {
      lastListingIdRef.current = currentId;

      // Only reset if we're not currently in an exit animation
      if (!isExitingRef.current) {
        hasExited.current = false;
        setCurrentImageIndex(0);
        x.set(0);
        y.set(0);
      }
    }
  }, [listing.id, (listing as any).user_id, x, y]);

  // Magnifier hook for press-and-hold zoom
  const { containerRef, pointerHandlers: magnifierPointerHandlers, isActive: isMagnifierActive } = useMagnifier({
    scale: 2.8, // Edge-to-edge zoom level
    holdDelay: 300,
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
      if (dx > 10 || dy > 10) {
        // Cancel any pending magnifier hold timer
        magnifierPointerHandlers.onPointerUp(e);
        dragStartedRef.current = true;
        isDragging.current = true;
        dragControls.start((storedPointerEventRef.current as any).nativeEvent);
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

    // LEFT 33% - Prev image
    if (imageCount > 1 && clickX < width * 0.33) {
      setPhotoDirection('left');
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
      triggerHaptic('light');
    }
    // RIGHT 33% - Next image
    else if (imageCount > 1 && clickX > width * 0.67) {
      setPhotoDirection('right');
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
      triggerHaptic('light');
    }
    // MIDDLE 34% or any click on single image - Open Insights
    else if (onInsights) {
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
        className="absolute inset-x-2 bottom-4 top-4 rounded-[2.5rem] overflow-hidden shadow-sm"
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
    <div className="absolute inset-0 flex flex-col pointer-events-auto">
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.55}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardTap}
        onPointerDown={handleUnifiedPointerDown}
        onPointerMove={(e) => {
          handleUnifiedPointerMove(e);
          // Skip the parallax tilt entirely while dragging — its rotateX/rotateY
          // fights the drag rotation and produces visible flicker on touch.
          if (!isDragging.current) {
            handlePointerMoveForTilt(e);
          }
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
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative w-full h-full overflow-hidden rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),0_16px_32px_-8px_rgba(0,0,0,0.3)] pointer-events-auto border-none gpu-ultra"
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
          transform: 'translate3d(0,0,0)', // 🏎️ FORCE GPU LAYER
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'rgba(255, 255, 255, 0.01)',
          // No backdrop-filter on the moving card — backdrop-filter forces
          // the browser to recomposite the entire card area on every drag
          // frame, which is the primary source of the shake/flicker.
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

          {/* Cinema Top Fade — theme-aware vignette behind header buttons */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: '28%',
              background: isLight
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.05) 75%, transparent 100%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.05) 75%, transparent 100%)',
            }}
          />
          
          {imageCount > 1 && (
            <div className="absolute top-[calc(var(--safe-top,0px)+56px)] left-3 right-3 flex gap-1.5 z-20">
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

          {/* In-Card Navigation Buttons (Tinder Style) */}
          <div className="absolute top-[calc(var(--safe-top,0px)+80px)] left-6 right-6 z-40 flex justify-between pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onShare?.();
              }}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all pointer-events-auto"
              title="Share Listing"
            >
              <Share2 className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                onReport?.();
              }}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 active:scale-90 transition-all pointer-events-auto"
              title="Report Listing"
            >
              <Flag className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* LIKE stamp — shown top-right when swiping right */}
        <motion.div
          className="absolute top-10 right-6 z-30 pointer-events-none"
          style={{
            opacity: likeOpacity,
            willChange: 'opacity',
          }}
        >
          <div
            className="flex flex-col items-center gap-1.5"
            style={{ transform: 'rotate(15deg) translateZ(0)' }}
          >
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.15)',
                backdropFilter: 'blur(8px)',
                border: '3px solid #10b981',
                boxShadow: '0 0 28px rgba(16,185,129,0.55), inset 0 0 12px rgba(16,185,129,0.15)',
              }}
            >
              <ThumbsUp className="w-9 h-9 text-emerald-400" fill="currentColor" strokeWidth={0} />
            </div>
            <div
              className="px-4 py-1 rounded-lg"
              style={{
                border: '2.5px solid #10b981',
                background: 'rgba(16,185,129,0.12)',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 0 18px rgba(16,185,129,0.4)',
              }}
            >
              <span
                className="font-black text-xl tracking-[0.18em] uppercase text-emerald-400"
                style={{ textShadow: '0 0 14px rgba(16,185,129,0.9)' }}
              >
                LIKE
              </span>
            </div>
          </div>
        </motion.div>

        {/* NOPE stamp — shown top-left when swiping left */}
        <motion.div
          className="absolute top-10 left-6 z-30 pointer-events-none"
          style={{
            opacity: passOpacity,
            willChange: 'opacity',
          }}
        >
          <div
            className="flex flex-col items-center gap-1.5"
            style={{ transform: 'rotate(-15deg) translateZ(0)' }}
          >
            <div
              className="px-5 py-2.5 rounded-xl"
              style={{
                border: '3px solid #f43f5e',
                background: 'rgba(244,63,94,0.12)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 28px rgba(244,63,94,0.5), inset 0 0 12px rgba(244,63,94,0.1)',
              }}
            >
              <span
                className="font-black text-4xl tracking-[0.15em] uppercase text-rose-400"
                style={{ textShadow: '0 0 16px rgba(244,63,94,0.9)' }}
              >
                NOPE
              </span>
            </div>
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(244,63,94,0.15)',
                backdropFilter: 'blur(6px)',
                border: '2.5px solid #f43f5e',
                boxShadow: '0 0 18px rgba(244,63,94,0.45)',
              }}
            >
              <ThumbsDown className="w-6 h-6 text-rose-400" fill="currentColor" strokeWidth={0} />
            </div>
          </div>
        </motion.div>

        {/* 🚀 PREMIUM INFUSION: Dissolving Info Overlay in bottom-left */}
        <div
          key={`info-${currentImageIndex % 4}`}
          className="absolute left-6 bottom-[178px] z-30 pointer-events-none max-w-[80%]"
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

            {(() => {
              const isProfile = (listing as any).profile_images || (listing as any).name;
              if (isProfile) {
                const profile = listing as MatchedClientProfile;
                return (
                  <ClientCardInfo
                    name={profile.name}
                    age={profile.age}
                    budgetMin={profile.budget_min}
                    budgetMax={profile.budget_max}
                    location={profile.city}
                    occupation={(profile as any).occupation || (profile as any).client_type}
                    isVerified={profile.verified}
                    photoIndex={currentImageIndex}
                    workSchedule={profile.work_schedule}
                    className="!text-white !space-y-0"
                  />
                );
              }
              if ((listing as any).category === 'vehicle' || (listing as any).vehicle_type) {
                return (
                  <VehicleCardInfo
                    price={(listing as any).price || 0}
                    priceType={(listing as any).rental_duration_type === 'monthly' ? 'month' : 'day'}
                    make={(listing as any).vehicle_brand ?? undefined}
                    model={(listing as any).vehicle_model ?? undefined}
                    year={(listing as any).year ?? undefined}
                    location={(listing as any).city ?? undefined}
                    isVerified={(listing as any).has_verified_documents ?? undefined}
                    photoIndex={currentImageIndex}
                    className="!text-white !space-y-0"
                  />
                );
              }
              if ((listing as any).category === 'worker' || (listing as any).category === 'services' || (listing as any).service_category) {
                return (
                  <ServiceCardInfo
                    hourlyRate={(listing as any).price || 0}
                    pricingUnit={(listing as any).pricing_unit || 'hr'}
                    serviceName={(listing as any).service_category || (listing as any).title || 'Service'}
                    name={(listing as any).title}
                    location={(listing as any).city ?? undefined}
                    isVerified={(listing as any).has_verified_documents ?? undefined}
                    photoIndex={currentImageIndex}
                    className="!text-white !space-y-0"
                  />
                );
              }
              return (
                <PropertyCardInfo
                  price={(listing as any).price || 0}
                  priceType={(listing as any).rental_duration_type === 'monthly' ? 'month' : 'night'}
                  propertyType={(listing as any).property_type ?? undefined}
                  beds={(listing as any).beds ?? undefined}
                  baths={(listing as any).baths ?? undefined}
                  location={(listing as any).city ?? undefined}
                  isVerified={(listing as any).has_verified_documents ?? undefined}
                  photoIndex={currentImageIndex}
                  className="!text-white !space-y-0"
                />
              );
            })()}
          </motion.div>
        </div>

        {/* Cinema Bottom Fade — theme-aware vignette behind nav + action buttons */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
          style={{
            height: '55%',
            background: isLight
              ? 'linear-gradient(to top, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0.06) 65%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.06) 65%, transparent 100%)',
          }}
        />

        {/* Edge vignette — perimeter inset shadow that outlines the rounded corners
            so the card always reads as a physical object */}
        <div
          className="absolute inset-0 pointer-events-none z-[25] rounded-[2.5rem]"
          style={{
            boxShadow: isLight
              ? 'inset 0 0 0 1.5px rgba(0,0,0,0.10), inset 0 0 40px rgba(0,0,0,0.18)'
              : 'inset 0 0 0 1.5px rgba(255,255,255,0.08), inset 0 0 50px rgba(0,0,0,0.45)',
          }}
        />

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


