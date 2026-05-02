/**
 * TINDER-STYLE OWNER SWIPE CARD
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
import { motion, useMotionValue, useTransform, PanInfo, animate, useDragControls } from 'framer-motion';
import { MapPin, DollarSign, Briefcase, Flag, Share2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

import { useMagnifier } from '@/hooks/useMagnifier';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useUserRatingAggregateEnhanced } from '@/hooks/useRatingSystem';
import { getWorkScheduleLabel } from '@/constants/profileConstants';
import { SwipeMatchMeter } from '@/components/swipe/SwipeMatchMeter';
import useAppTheme from '@/hooks/useAppTheme';
import { useDeviceParallax } from '@/hooks/useDeviceParallax';



// Exposed interface for parent to trigger swipe animations
export interface SimpleOwnerSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

// Tinder-style thresholds
const SWIPE_THRESHOLD = 45; // Distance to trigger swipe
const VELOCITY_THRESHOLD = 200; // Velocity to trigger swipe

// Max rotation angle (degrees) based on horizontal position
const MAX_ROTATION = 15; // Slightly reduced for a more "expensive" feel

// Calculate exit distance dynamically based on viewport
const getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;
const FALLBACK_PLACEHOLDER = '/placeholder.svg';

/**
 * SPRING CONFIGS - Tinder-tuned physics
 * Optimized for "Velocity" - minimal drag and maximum return speed
 */
const SPRING_CONFIGS = {
  // SILK: iOS-native silky feel — responsive but graceful settling
  SILK: { stiffness: 400, damping: 24, mass: 0.3 },
  // NATIVE: iOS-like balanced feel
  NATIVE: { stiffness: 450, damping: 28, mass: 1 },
  // PREMIUM: Heavy, smooth, luxurious
  PREMIUM: { stiffness: 350, damping: 25, mass: 1.2 },
};

const ACTIVE_SPRING = SPRING_CONFIGS.SILK;

// Client profile type
interface ClientProfile {
  user_id: string;
  name?: string | null;
  age?: number | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  profile_images?: string[] | null;
  interests?: string[] | null;
  languages?: string[] | null;
  work_schedule?: string | null;
  cleanliness_level?: string | null;
  noise_tolerance?: string | null;
  personality_traits?: string[] | null;
  preferred_activities?: string[] | null;
  // From profiles table
  budget_min?: number | null;
  budget_max?: number | null;
  monthly_income?: number | null;
  verified?: boolean | null;
  lifestyle_tags?: string[] | null;
  preferred_listing_types?: string[] | null;
}

// Placeholder component for profiles without photos
const PlaceholderImage = memo(({ name }: { name?: string | null }) => {
  return (
    <div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 text-center"
      style={{
        transform: 'translateZ(0)',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] uppercase">SWIPESS</h1>
        <div className="h-1 w-12 bg-white/40 mt-2 rounded-full" />
      </div>
      <h3 className="text-white text-2xl font-black tracking-tight mb-2 uppercase">{name || 'Client'}</h3>
      <p className="text-white/70 text-sm font-bold uppercase tracking-wider leading-relaxed">
        No photos available yet
      </p>
    </div>
  );
});

// Use shared image cache to prevent reloading and blinking
import { imageCache } from '@/lib/swipe/cardImageCache';

/**
 * FULL-SCREEN CARD IMAGE
 *
 * CRITICAL: Image MUST cover 100% of viewport (edge-to-edge, top-to-bottom)
 * - Uses position: absolute + inset: 0
 * - object-fit: cover ensures no letterboxing
 * - Sits at the LOWEST z-layer (z-index: 1)
 * - Preloads image when rendered (for next card in stack)
 */
const CardImage = memo(({ 
  src, 
  alt, 
  name, 
  priority = false,
  fullScreen = false
}: { 
  src: string; 
  alt: string; 
  name?: string | null;
  priority?: boolean;
  fullScreen?: boolean;
}) => {
  const [loaded, setLoaded] = useState(() => imageCache.has(src));
  const [error, setError] = useState(false);

  // Show placeholder if no valid image
  const isPlaceholder = !src || src === FALLBACK_PLACEHOLDER || error;

  // CRITICAL FIX: Check cache on every render, not just once
  const wasInCache = useMemo(() => imageCache.has(src), [src]);

  // Preload image when card renders (for non-top cards)
  useEffect(() => {
    if (!src || error || isPlaceholder) return;

    // If already in cache, mark as loaded immediately
    if (imageCache.has(src)) {
      setLoaded(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, true);
      setLoaded(true);
    };
    img.onerror = () => setError(true);
    img.src = src;
  }, [src, error, isPlaceholder]);

  if (isPlaceholder) {
    return <PlaceholderImage name={name} />;
  }

  return (
    <div
      className={cn("absolute inset-0 w-full h-full", !fullScreen && "rounded-[24px]")}
      style={{
        transform: 'translateZ(0)',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Skeleton - only show if image not in cache */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20"
        style={{
          opacity: loaded ? 0 : 1,
          transition: wasInCache ? 'none' : 'opacity 150ms ease-out',
          transform: 'translateZ(0)',
        }}
      />

      {/* Image - FULL VIEWPORT coverage */}
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 w-full h-full", !fullScreen && "rounded-[24px]", loaded ? "" : "")}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: loaded ? 1 : 0,
          transition: wasInCache ? 'none' : 'opacity 150ms ease-out',
          WebkitUserDrag: 'none',
          pointerEvents: 'none',
          animation: loaded ? 'photo-swim 12s ease-in-out infinite' : 'none',
          willChange: loaded ? 'transform' : 'auto',
        } as React.CSSProperties}
        onLoad={() => {
          imageCache.set(src, true);
          setLoaded(true);
        }}
        onError={() => setError(true)}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
      />
    </div>
  );
});

interface SimpleOwnerSwipeCardProps {
  profile: ClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap?: () => void;
  onDetails?: () => void;
  onInsights?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onUndo?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  canUndo?: boolean;
  isTop?: boolean;
  fullScreen?: boolean;
  externalX?: any;
  onDragStart?: () => void;
}

const SimpleOwnerSwipeCardComponent = forwardRef<SimpleOwnerSwipeCardRef, SimpleOwnerSwipeCardProps>(({
  profile,
  onSwipe,
  onTap: _onTap,
  onDetails,
  onInsights,
  onMessage,
  onShare,
  onReport,
  onUndo,
  onLike,
  onDislike,
  canUndo,
  isTop = true,
  fullScreen = false,
  onDragStart,
}, ref) => {
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastProfileIdRef = useRef(profile?.user_id || '');
  const dragStartY = useRef(0);
  const dragStartedRef = useRef(false);
  const dragControls = useDragControls();
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);
  const { theme } = useAppTheme();
  const _isDark = theme === 'dark';

  // Motion values for BOTH X and Y - enables diagonal movement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Moving Glass Shine effect
  const shineX = useTransform(x, [-300, 300], ['-50%', '150%']);
  const shineY = useTransform(y, [-300, 300], ['-50%', '150%']);
  const shineOpacity = useTransform(
    [x, y],
    ([latestX, latestY]: any) => {
      const distance = Math.sqrt(latestX ** 2 + latestY ** 2);
      return Math.min(0.3, distance / 400);
    }
  );

  // Tinder-style rotation: pivots from bottom of card based on X drag
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

  // 🚀 FLAGSHIP FEATURE: 3D Perspective Tilt based on pointer pos & Device Gyroscope
  const pointerRotateX = useMotionValue(0);
  const pointerRotateY = useMotionValue(0);
  const { tiltX: gyroTiltX, tiltY: gyroTiltY } = useDeviceParallax(0.4);

  const rotateX = useTransform(pointerRotateX, (val) => val - gyroTiltY);
  const rotateY = useTransform(pointerRotateY, (val) => val + gyroTiltX);

  const handlePointerMoveForTilt = useCallback((e: React.PointerEvent) => {
    // Skip parallax tilt while dragging — feeding rotateX/rotateY into the
    // drag transform produces visible shake on touch screens.
    if (!isTop || isDragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate relative offset (-1 to 1)
    const rotateYVal = ((xPos - centerX) / centerX) * 6; // Max 6 deg tilt
    const rotateXVal = ((centerY - yPos) / centerY) * 6; // Max 6 deg tilt
    
    pointerRotateY.set(rotateYVal);
    pointerRotateX.set(rotateXVal);
  }, [isTop, pointerRotateX, pointerRotateY]);

  const handlePointerLeaveForTilt = useCallback(() => {
    animate(pointerRotateX, 0, { duration: 0.5 });
    animate(pointerRotateY, 0, { duration: 0.5 });
  }, [pointerRotateX, pointerRotateY]);

  // Fetch user rating aggregate for this client profile
  const { data: ratingAggregate, isLoading: isRatingLoading } = useUserRatingAggregateEnhanced(profile?.user_id);

  // Image state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [_magnifierActive, setMagnifierActive] = useState(false);

  const images = useMemo(() => {
    // FIX: Add null check for profile
    if (!profile) return [FALLBACK_PLACEHOLDER];
    return Array.isArray(profile.profile_images) && profile.profile_images.length > 0
      ? profile.profile_images
      : [FALLBACK_PLACEHOLDER];
  }, [profile]); // FIX: Depend on entire profile, not just profile_images

  const imageCount = images.length;
  const currentImage = images[currentImageIndex] || FALLBACK_PLACEHOLDER;

  // Preload all images for current card when it's the top card to prevent blinking
  useEffect(() => {
    if (!isTop || !images.length) return;

    images.forEach((imageUrl) => {
      if (imageUrl && imageUrl !== FALLBACK_PLACEHOLDER && !imageCache.has(imageUrl)) {
        const img = new Image();
        img.onload = () => imageCache.set(imageUrl, true);
        img.src = imageUrl;
      }
    });
  }, [isTop, images, profile?.user_id]);

  // Reset state when profile changes - but ONLY if we're not mid-exit
  // This prevents the snap-back glitch caused by resetting during exit animation
  useEffect(() => {
    // FIX: Add null/undefined check for profile to prevent errors
    if (!profile || !profile.user_id) {
      return;
    }

    // Check if this is a genuine profile change (not a re-render during exit)
    if (profile.user_id !== lastProfileIdRef.current) {
      lastProfileIdRef.current = profile.user_id;

      // Only reset if we're not currently in an exit animation
      // This prevents the glitch where the card snaps back before disappearing
      if (!isExitingRef.current) {
        hasExited.current = false;
        setCurrentImageIndex(0);
        x.set(0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id, x, y]);


  // Magnifier hook for press-and-hold zoom - MUST be called before any callbacks that use it
  const { containerRef, pointerHandlers: magnifierPointerHandlers, isActive: isMagnifierActive, isHoldPending } = useMagnifier({
    scale: 2.8,
    holdDelay: 300, // snappier 'automatic' zoom
    enabled: isTop,
    onActiveChange: setMagnifierActive,
  });

  // Unified pointer down handler
  const handleUnifiedPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    dragStartedRef.current = false;
    storedPointerEventRef.current = e;
    magnifierPointerHandlers.onPointerDown(e);
  }, [isTop, magnifierPointerHandlers]);

  // Unified pointer move: decides between magnifier pan vs starting drag
  const handleUnifiedPointerMove = useCallback((e: React.PointerEvent) => {
    // If magnifier zoom is active, delegate to magnifier panning
    if (isMagnifierActive()) {
      magnifierPointerHandlers.onPointerMove(e);
      return;
    }

    // Not zoomed — check if we should start a drag
    if (storedPointerEventRef.current && !dragStartedRef.current) {
      const startX = storedPointerEventRef.current.clientX;
      const startY = storedPointerEventRef.current.clientY;
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > 10 || dy > 10) {
        // Cancel any pending magnifier hold timer
        if (isHoldPending()) {
          magnifierPointerHandlers.onPointerUp(e);
        }
        // Native drag will automatically start via motion.div
        dragStartedRef.current = true;
        dragControls.start(storedPointerEventRef.current);
      }
    }
  }, [magnifierPointerHandlers, isMagnifierActive, dragControls]);

  const handleUnifiedPointerUp = useCallback((e: React.PointerEvent) => {
    magnifierPointerHandlers.onPointerUp(e);
    storedPointerEventRef.current = null;
    dragStartedRef.current = false;
  }, [magnifierPointerHandlers]);

  const _handleUnifiedPointerCancel = useCallback((e: React.PointerEvent) => {
    magnifierPointerHandlers.onPointerCancel(e);
    storedPointerEventRef.current = null;
    dragStartedRef.current = false;
  }, [magnifierPointerHandlers]);

  const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = true;
    dragStartY.current = info.point.y;
    // Clear any in-progress parallax tilt so the drag rotation isn't stacked
    // on top of stale rotateX/rotateY values (cause of the shake on grab).
    pointerRotateX.set(0);
    pointerRotateY.set(0);
  }, [pointerRotateX, pointerRotateY]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
      const exitY = Math.tan(swipeAngle) * exitDistance;

      // Spring-based exit animation - feels more natural than tween
      animate(x, exitX, {
        type: 'spring',
        stiffness: 400,
        damping: 24,
        velocity: velocityX,
        onComplete: () => {
          isExitingRef.current = false;
          onSwipe(direction);
        },
      });

      // Animate Y in parallel
      animate(y, Math.min(Math.max(exitY, -300), 300), {
        type: 'spring',
        stiffness: 400,
        damping: 24,
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
  }, [onSwipe, x, y]);

  const handleCardTap = useCallback(() => {
    if (!isDragging.current && _onTap) {
      _onTap();
    }
  }, [_onTap]);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't handle tap if magnifier is active - allows zoom to work
    if (isMagnifierActive()) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // LEFT 33% - Prev image
    if (imageCount > 1 && clickX < width * 0.33) {
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
      triggerHaptic('light');
    }
    // RIGHT 33% - Next image
    else if (imageCount > 1 && clickX > width * 0.67) {
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
      triggerHaptic('light');
    }
    // MIDDLE 34% or any click on single image - Open Insights
    else if (onInsights) {
      triggerHaptic('light');
      onInsights();
    } else if (_onTap) {
      triggerHaptic('light');
      _onTap();
    }
  }, [imageCount, onInsights, isMagnifierActive]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    if (hasExited.current) return;
    hasExited.current = true;
    isExitingRef.current = true;

    triggerHaptic(direction === 'right' ? 'success' : 'warning');

    const exitX = direction === 'right' ? getExitDistance() : -getExitDistance();

    // Track if onSwipe was called to prevent double-fire
    let swipeFired = false;
    const fireSwipe = () => {
      if (swipeFired) return;
      swipeFired = true;
      isExitingRef.current = false;
      onSwipe(direction);
    };

    // Spring-based exit for button taps (consistent physics)
    animate(x, exitX, {
      type: 'spring',
      stiffness: 400,
      damping: 24,
      onComplete: fireSwipe,
    });

    animate(y, -50, {
      type: 'spring',
      stiffness: 400,
      damping: 24,
    });

    // SAFETY NET: If animation callback doesn't fire within 350ms, force it
    setTimeout(fireSwipe, 350);
  }, [onSwipe, x, y]);

  // Expose triggerSwipe method to parent via ref
  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  // FIX: Early return if profile is null/undefined to prevent errors
  if (!profile || !profile.user_id) {
    return null;
  }

  const budgetText = profile.budget_min && profile.budget_max
    ? `$${profile.budget_min.toLocaleString()} - $${profile.budget_max.toLocaleString()}`
    : profile.budget_max
      ? `Up to $${profile.budget_max.toLocaleString()}`
      : null;

  if (!isTop) {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
        <div className="absolute inset-0 opacity-50">
          <CardImage
            src={currentImage}
            alt={profile.name || 'Client'}
            name={profile.name}
            fullScreen={true}
            priority={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        dragDirectionLock={false}
        onClick={handleCardTap}
        onPointerDown={handleUnifiedPointerDown}
        onPointerMove={(e) => {
          handleUnifiedPointerMove(e);
          if (!isDragging.current) {
            handlePointerMoveForTilt(e);
          }
        }}
        onPointerLeave={handlePointerLeaveForTilt}
        onPointerUp={(e) => {
          handleUnifiedPointerUp(e);
          handlePointerLeaveForTilt();
        }}
        animate={{ 
          scale: 1, 
          transition: { type: 'spring', stiffness: 400, damping: 28 }
        }}
        // Photo swim effect now lives on the <img> inside CardImage (CSS keyframes)
        style={{
          x,
          y,
          rotate: cardRotate,
          rotateX,
          rotateY,
          opacity: cardOpacity,
          transformOrigin: 'bottom center',
          willChange: 'transform, opacity',
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          transform: 'translateZ(0)',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.01)',
          // backdrop-filter removed from the dragged motion.div — it forced a
          // full recomposite on every frame and was the main shake/flicker
          // source. Background blur is handled by the photo layer below.
        } as any}
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative overflow-hidden w-full h-full rounded-none"
      >
        {/* Glass Shine */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ opacity: shineOpacity }}
        >
          <motion.div
            className="absolute w-[200%] h-[200%] bg-gradient-radial from-white/20 via-transparent to-transparent"
            style={{
              left: shineX,
              top: shineY,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </motion.div>

        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full overflow-hidden"
          onClick={handleImageTap}
          style={{ touchAction: 'none' }}
        >
          <CardImage
            src={currentImage}
            alt={profile.name || 'Client'}
            name={profile.name}
            priority={isTop}
            fullScreen={true}
          />

          {/* Cinema Top Fade */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: '22%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
            }}
          />
          {/* Cinema Bottom Fade */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: '52%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }}
          />

          {imageCount > 1 && (
            <div 
              className="absolute top-[calc(var(--safe-top,0px)+56px)] left-3 right-3 z-30 flex gap-1.5 transform-gpu" 
            >
               {images.map((_, idx) => (
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

          {/* In-Card Navigation Buttons — consistent contrast across themes.
              Share = primary action (white solid). Report = ghost with red accent. */}
          <div className="absolute top-[calc(var(--safe-top,0px)+80px)] left-4 right-4 z-40 flex justify-between pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onShare?.();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full backdrop-blur-md active:scale-95 transition-all pointer-events-auto shadow-lg bg-white text-black border border-black/10"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[10px] font-black uppercase tracking-wider">Share</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                onReport?.();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full backdrop-blur-md active:scale-95 transition-all pointer-events-auto shadow-lg bg-black/55 text-red-300 border border-red-400/40"
              title="Report Profile"
            >
              <Flag className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[10px] font-black uppercase tracking-wider">Report</span>
            </button>
          </div>
        </div>

        <motion.div
          className="absolute top-28 left-8 z-30 pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="px-6 py-3 rounded-xl border-4 border-emerald-500 text-emerald-500 font-black text-3xl tracking-wider" style={{ transform: 'rotate(-12deg)' }}>
            YES!
          </div>
        </motion.div>

        <motion.div
          className="absolute top-28 right-8 z-30 pointer-events-none"
          style={{ opacity: passOpacity }}
        >
          <div className="px-6 py-3 rounded-xl border-4 border-red-600 text-red-600 font-black text-3xl tracking-wider" style={{ transform: 'rotate(12deg)' }}>
            NOPE
          </div>
        </motion.div>



        {/* Cinema Bottom Fade — theme-aware vignette behind nav + action buttons */}
        <div
          className="absolute left-0 right-0 bottom-0 z-15 pointer-events-none"
          style={{
            height: '60%',
            background: _isDark
              ? 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0) 100%)'
              : 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 35%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Cinema Top Fade — immersive header blending */}
        <div
          className="absolute left-0 right-0 top-0 z-15 pointer-events-none"
          style={{
            height: '150px',
            background: _isDark
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
          }}
        />

        <div
          key={`info-${currentImageIndex % 4}`}
          className={cn(
            "absolute left-5 right-5 bottom-[calc(var(--bottom-nav-height,72px)+100px)] z-30 pointer-events-none flex flex-col justify-end",
            fullScreen && "pb-[calc(100px+var(--safe-bottom))]"
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: -15, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-1.5"
          >
            {/* Photo 0 = clean first impression, no info overlay */}
            {currentImageIndex % 4 !== 0 && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {'matchPercentage' in profile && (profile as any).matchPercentage > 0 && (
                  <SwipeMatchMeter
                    percentage={(profile as any).matchPercentage}
                    reasons={(profile as any).matchReasons}
                    compact
                  />
                )}
                <div className="inline-flex rounded-full px-3 py-1.5 bg-black/35 backdrop-blur-[10px] border border-white/10">
                  <CompactRatingDisplay
                    aggregate={ratingAggregate ?? null}
                    isLoading={isRatingLoading}
                    showReviews={false}
                    className="text-white"
                  />
                </div>
              </div>
            )}

            {/* Photo 0 = CLEAN — no name, no info, just the portrait */}

            {currentImageIndex % 4 === 1 && (
              <>
                {budgetText && (
                  <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-fit">
                    <div className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-1">Target Budget</div>
                    <div className="flex items-center gap-1.5 text-white">
                      <DollarSign className="w-5 h-5 text-rose-500" />
                      <span className="text-2xl font-black tracking-tighter">{budgetText}</span>
                    </div>
                  </div>
                )}
                {!budgetText && profile.work_schedule && (
                  <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-fit">
                    <div className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-1">Work Life</div>
                    <div className="flex items-center gap-1.5 text-white">
                      <Briefcase className="w-5 h-5 text-purple-500" />
                      <span className="text-base font-black tracking-tight uppercase">{getWorkScheduleLabel(profile.work_schedule)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {currentImageIndex % 4 === 2 && profile.city && (
              <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-fit">
                <div className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-1">Sector</div>
                <div className="flex items-center gap-1.5 text-white">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span className="text-xl font-black tracking-tighter uppercase">{profile.city}{profile.country ? `, ${profile.country}` : ''}</span>
                </div>
              </div>
            )}

            {currentImageIndex % 4 === 3 && (
              <div className="flex flex-wrap gap-2">
                {(profile.interests?.slice(0, 3) || ['Quiet & Clean']).map((interest, i) => (
                  <div key={i} className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white font-black text-[10px] uppercase tracking-widest">
                    {interest}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});

export const SimpleOwnerSwipeCard = memo(SimpleOwnerSwipeCardComponent);
export default SimpleOwnerSwipeCard;


