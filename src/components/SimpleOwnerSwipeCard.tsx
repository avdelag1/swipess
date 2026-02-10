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
import { motion, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
import { MapPin, DollarSign, Briefcase } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { SwipeActionButtonBar } from './SwipeActionButtonBar';
import { useMagnifier } from '@/hooks/useMagnifier';
import { GradientMaskTop, GradientMaskBottom } from '@/components/ui/GradientMasks';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useUserRatingAggregate } from '@/hooks/useRatingSystem';
import { useParallaxStore } from '@/state/parallaxStore';

// Exposed interface for parent to trigger swipe animations
export interface SimpleOwnerSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

// Tinder-style thresholds
const SWIPE_THRESHOLD = 100; // Distance to trigger swipe
const VELOCITY_THRESHOLD = 400; // Velocity to trigger swipe

// Max rotation angle (degrees) based on horizontal position
const MAX_ROTATION = 12;

// Calculate exit distance dynamically based on viewport
const getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;
const FALLBACK_PLACEHOLDER = '/placeholder.svg';

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
      className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center"
      style={{
        transform: 'translateZ(0)',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
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
        <p className="text-white text-xl font-bold mb-2 drop-shadow-lg">
          {name || 'Client Profile'}
        </p>
        <p className="text-white/90 text-base font-medium drop-shadow-md">
          Waiting for client to upload photos :)
        </p>
      </div>
    </div>
  );
});

// Image cache to prevent reloading and blinking
const imageCache = new Map<string, boolean>();

/**
 * FULL-SCREEN CARD IMAGE
 *
 * CRITICAL: Image MUST cover 100% of viewport (edge-to-edge, top-to-bottom)
 * - Uses position: absolute + inset: 0
 * - object-fit: cover ensures no letterboxing
 * - Sits at the LOWEST z-layer (z-index: 1)
 * - Preloads image when rendered (for next card in stack)
 */
const CardImage = memo(({ src, alt, name }: { src: string; alt: string; name?: string | null }) => {
  const [loaded, setLoaded] = useState(() => imageCache.has(src));
  const [error, setError] = useState(false);

  // Show placeholder if no valid image
  const isPlaceholder = !src || src === FALLBACK_PLACEHOLDER || error;

  if (isPlaceholder) {
    return <PlaceholderImage name={name} />;
  }

  // CRITICAL FIX: Check cache on every render, not just once
  // This ensures cached images show instantly when tapping between photos
  const wasInCache = useMemo(() => imageCache.has(src), [src]);

  // Preload image when card renders (for non-top cards)
  useEffect(() => {
    if (!src || error) return;

    // If already in cache, mark as loaded immediately (no transition)
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
  }, [src, error]);

  return (
    <div
      className="absolute inset-0 w-full h-full rounded-[24px]"
      style={{
        // GPU acceleration
        transform: 'translateZ(0)',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        // LOWEST z-layer - image sits behind everything
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Skeleton - only show if image not in cache, smooth 150ms crossfade */}
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
        className="absolute inset-0 w-full h-full rounded-[24px]"
        style={{
          // CRITICAL: object-fit: cover ensures no letterboxing/padding
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: loaded ? 1 : 0,
          transition: wasInCache ? 'none' : 'opacity 150ms ease-out',
          WebkitUserDrag: 'none',
          pointerEvents: 'none',
        } as React.CSSProperties}
        onLoad={() => {
          imageCache.set(src, true);
          setLoaded(true);
        }}
        onError={() => setError(true)}
        draggable={false}
        loading="eager"
        decoding="async"
      />
    </div>
  );
});

interface SimpleOwnerSwipeCardProps {
  profile: ClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onInsights?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  isTop?: boolean;
  hideActions?: boolean;
}

const SimpleOwnerSwipeCardComponent = forwardRef<SimpleOwnerSwipeCardRef, SimpleOwnerSwipeCardProps>(({
  profile,
  onSwipe,
  onTap,
  onUndo,
  canUndo = false,
  onInsights,
  onMessage,
  onShare,
  isTop = true,
  hideActions = false,
}, ref) => {
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastProfileIdRef = useRef(profile?.user_id || '');
  const dragStartY = useRef(0);

  // Motion values for BOTH X and Y - enables diagonal movement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

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

  // Fetch user rating aggregate for this client profile
  const { data: ratingAggregate, isLoading: isRatingLoading } = useUserRatingAggregate(profile?.user_id);

  // Image state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
  }, [profile?.user_id, x, y]);

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

  // Magnifier hook for press-and-hold zoom - MUST be called before any callbacks that use it
  const { containerRef, pointerHandlers, isActive: isMagnifierActive } = useMagnifier({
    scale: 2.0,
    holdDelay: 350,
    enabled: isTop,
  });

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
  }, [profile?.user_id, onSwipe, x, y, endParallaxDrag]);

  const handleCardTap = useCallback(() => {
    if (!isDragging.current && onTap) {
      onTap();
    }
  }, [onTap]);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't handle tap if magnifier is active - allows zoom to work
    if (isMagnifierActive()) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // Left third - previous image (only if multiple images)
    if (clickX < width * 0.3 && imageCount > 1) {
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
      triggerHaptic('light');
    }
    // Right third - next image (only if multiple images)
    else if (clickX > width * 0.7 && imageCount > 1) {
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
      triggerHaptic('light');
    }
    // Middle area - open insights
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
  }, [profile?.user_id, onSwipe, x, y]);

  // Expose triggerSwipe method to parent via ref
  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  // FIX: Early return if profile is null/undefined to prevent errors
  // All hooks must be called above this point to maintain hook order
  if (!profile || !profile.user_id) {
    return null;
  }

  // Format budget - moved AFTER null check to prevent errors
  const budgetText = profile.budget_min && profile.budget_max
    ? `$${profile.budget_min.toLocaleString()} - $${profile.budget_max.toLocaleString()}`
    : profile.budget_max
      ? `Up to $${profile.budget_max.toLocaleString()}`
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
        <CardImage src={currentImage} alt={profile.name || 'Client'} name={profile.name} />
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
          <CardImage src={currentImage} alt={profile.name || 'Client'} name={profile.name} />

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
        
        {/* Content overlay - Positioned higher for Tinder style (above button area) */}
        <div className="absolute bottom-24 left-0 right-0 p-4 z-20 pointer-events-none">
          {/* Rating Display - Bottom of card, above profile info (same as client side) */}
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

          {/* Photo 0: Name + Age */}
          {currentImageIndex % 4 === 0 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white text-2xl font-bold drop-shadow-lg">
                  {profile.name || 'Anonymous'}
                </h2>
                {profile.age && (
                  <span className="text-white/80 text-xl">{profile.age}</span>
                )}
              </div>
              {profile.city && (
                <div className="flex items-center gap-1 text-white/90 text-base">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{profile.city}{profile.country ? `, ${profile.country}` : ''}</span>
                </div>
              )}
            </>
          )}

          {/* Photo 1: Budget */}
          {currentImageIndex % 4 === 1 && (
            <>
              {budgetText && (
                <>
                  <div className="text-lg text-white/80 font-medium mb-1">Monthly Budget</div>
                  <div className="flex items-center gap-1 text-white/90">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-2xl font-bold drop-shadow-lg">{budgetText}</span>
                  </div>
                </>
              )}
              {!budgetText && profile.work_schedule && (
                <div className="flex items-center gap-1 bg-white/20 px-3 py-2 rounded-full w-fit">
                  <Briefcase className="w-4 h-4 text-white" />
                  <span className="text-base font-medium text-white">{profile.work_schedule}</span>
                </div>
              )}
            </>
          )}

          {/* Photo 2: Location + Work Schedule */}
          {currentImageIndex % 4 === 2 && (
            <>
              {profile.city && (
                <div className="flex items-center gap-1 text-white/90 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xl font-bold drop-shadow-lg">
                    {profile.city}{profile.country ? `, ${profile.country}` : ''}
                  </span>
                </div>
              )}
              {profile.work_schedule && (
                <div className="flex items-center gap-1 bg-white/20 px-3 py-2 rounded-full w-fit">
                  <Briefcase className="w-4 h-4 text-white" />
                  <span className="text-base font-medium text-white">{profile.work_schedule}</span>
                </div>
              )}
            </>
          )}

          {/* Photo 3+: Full Summary */}
          {currentImageIndex % 4 === 3 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white text-xl font-bold">
                  {profile.name || 'Anonymous'}
                </h2>
                {profile.age && (
                  <span className="text-white/80 text-lg">{profile.age}</span>
                )}
              </div>

              {profile.city && (
                <div className="flex items-center gap-1 text-white/80 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}{profile.country ? `, ${profile.country}` : ''}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-white/90 text-sm">
                {budgetText && (
                  <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                    <DollarSign className="w-3 h-3" /> {budgetText}
                  </span>
                )}
                {profile.work_schedule && (
                  <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                    <Briefcase className="w-3 h-3" /> {profile.work_schedule}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Action buttons INSIDE card - Tinder style */}
        {!hideActions && (
          <div
            className="absolute bottom-4 left-0 right-0 flex justify-center z-30"
            onClick={(e) => {
              // Prevent clicks in button area from bubbling to card handler
              e.stopPropagation();
            }}
          >
            <SwipeActionButtonBar
              onLike={() => handleButtonSwipe('right')}
              onDislike={() => handleButtonSwipe('left')}
              onShare={onShare}
              onUndo={onUndo}
              onMessage={onMessage}
              canUndo={canUndo}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
});

export const SimpleOwnerSwipeCard = memo(SimpleOwnerSwipeCardComponent);
