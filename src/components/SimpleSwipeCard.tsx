/**
 * TINDER-STYLE SWIPE CARD — Nexus Edition
 *
 * Full diagonal movement with physics-based animations.
 * Card follows finger freely in any direction with natural rotation.
 * 
 * KEY FEATURES:
 * - Free XY movement (diagonal swipes)
 * - Rotation based on drag position (pivot from bottom)
 * - Spring physics for snap-back and exit
 * - Next card visible underneath with scale/opacity anticipation
 * - Advanced "Nexus" Zoom (Hold to Magnify)
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
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Flame } from 'lucide-react';

export interface SimpleSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 65;
const VELOCITY_THRESHOLD = 280;
const FALLBACK_PLACEHOLDER = '';
const MAX_ROTATION = 14;

const getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;

const SPRING_CONFIGS = {
  SILK: { stiffness: 500, damping: 25, mass: 0.4 },
};

const ACTIVE_SPRING = SPRING_CONFIGS.SILK;

interface SimpleSwipeCardProps {
  listing: Listing | MatchedListing | MatchedClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onInsights?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  isTop?: boolean;
  externalX?: MotionValue<number>;
  externalY?: MotionValue<number>;
  onDragStart?: () => void;
}

const SimpleSwipeCardComponent = forwardRef<SimpleSwipeCardRef, SimpleSwipeCardProps>(({
  listing,
  onSwipe,
  onInsights,
  isTop = true,
  externalX,
  externalY,
  onDragStart,
}, ref) => {
  const { isLight } = useAppTheme();
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastListingIdRef = useRef(listing.id || (listing as any).user_id);
  const dragControls = useDragControls();
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);

  const _internalX = useMotionValue(0);
  const _internalY = useMotionValue(0);
  const x = externalX ?? _internalX;
  const y = externalY ?? _internalY;

  const cardRotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const cardOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0.7, 1, 1, 1, 0.7]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState<'left' | 'right'>('right');

  const images = useMemo(() => {
    let result: string[] = [];
    const isProfile = (listing as any).profile_images || (listing as any).name;
    if (isProfile) {
      if (Array.isArray((listing as any).profile_images) && (listing as any).profile_images.length > 0) {
        result = (listing as any).profile_images;
      } else if ((listing as any).avatar_url) {
        result = [(listing as any).avatar_url];
      }
    } else {
      if ((listing as any).video_url) result.push((listing as any).video_url);
      if (Array.isArray((listing as any).images) && (listing as any).images.length > 0) {
        result = [...result, ...(listing as any).images];
      } else if ((listing as any).image_url) {
        result.push((listing as any).image_url);
      }
    }
    return result.length === 0 ? [FALLBACK_PLACEHOLDER] : result;
  }, [listing]);

  const imageCount = images.length;
  const currentImage = images[currentImageIndex] || FALLBACK_PLACEHOLDER;

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

  useEffect(() => {
    const currentId = listing.id || (listing as any).user_id;
    if (currentId !== lastListingIdRef.current) {
      lastListingIdRef.current = currentId;
      if (!isExitingRef.current) {
        hasExited.current = false;
        setCurrentImageIndex(0);
        x.set(0);
        y.set(0);
      }
    }
  }, [listing.id, (listing as any).user_id, x, y]);

  const [isZoomed, setIsZoomed] = useState(false);
  const { containerRef, pointerHandlers: magnifierPointerHandlers, isActive: isMagnifierActive, wasActive: wasMagnifierActive } = useMagnifier({
    scale: 2.8,
    holdDelay: 380,
    enabled: isTop,
    onActiveChange: setIsZoomed,
  });

  const { data: ratingAggregate, isLoading: isRatingLoading } = useListingRatingAggregate(listing.id, (listing as any).category);

  const handleUnifiedPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    dragStartedRef.current = false;
    storedPointerEventRef.current = e;
    magnifierPointerHandlers.onPointerDown(e);
  }, [isTop, magnifierPointerHandlers]);

  const handleUnifiedPointerMove = useCallback((e: React.PointerEvent) => {
    if (isMagnifierActive()) {
      e.stopPropagation();
      magnifierPointerHandlers.onPointerMove(e);
      return;
    }
    if (storedPointerEventRef.current && !dragStartedRef.current) {
      const dx = Math.abs(e.clientX - (storedPointerEventRef.current as any).clientX);
      const dy = Math.abs(e.clientY - (storedPointerEventRef.current as any).clientY);
      if (dx > 18 || dy > 18) {
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

  const handleDragStart = useCallback((_: any, info: PanInfo) => {
    isDragging.current = true;
    triggerHaptic('light');
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const sweepX = info.offset.x;
    const sweepY = info.offset.y;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;

    const isHorizontalSwipe = Math.abs(sweepX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD;
    const isVerticalUpSwipe = sweepY < -SWIPE_THRESHOLD || velocityY < -VELOCITY_THRESHOLD;

    if (isHorizontalSwipe) {
      const direction = sweepX > 0 ? 'right' : 'left';
      hasExited.current = true;
      isExitingRef.current = true;
      triggerHaptic(direction === 'right' ? 'success' : 'warning');
      onSwipe(direction);
    } else if (isVerticalUpSwipe) {
      hasExited.current = true;
      isExitingRef.current = true;
      triggerHaptic('light');
      onSwipe('left');
    } else {
      animate(x, 0, { type: 'spring', ...ACTIVE_SPRING });
      animate(y, 0, { type: 'spring', ...ACTIVE_SPRING });
    }
    setTimeout(() => { isDragging.current = false; }, 100);
  }, [onSwipe, x, y]);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    if (isMagnifierActive() || wasMagnifierActive()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (imageCount > 1 && clickX < width * 0.33) {
      setPhotoDirection('left');
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
      triggerHaptic('light');
    } else if (imageCount > 1 && clickX > width * 0.67) {
      setPhotoDirection('right');
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
      triggerHaptic('light');
    } else if (onInsights) {
      triggerHaptic('light');
      onInsights();
    }
  }, [imageCount, onInsights, isMagnifierActive, wasMagnifierActive]);

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
    animate(x, exitX, { type: 'tween', duration: 0.26, ease: [0.32, 0, 0.67, 0], onComplete: fireSwipe });
    animate(y, direction === 'right' ? -60 : 32, { type: 'tween', duration: 0.26, ease: [0.32, 0, 0.67, 0] });
    setTimeout(fireSwipe, 300);
  }, [onSwipe, x, y]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  if (!isTop) {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]" style={{ pointerEvents: 'none' }}>
        <div className="absolute inset-0">
          <CardImage
            src={currentImage}
            alt={(listing as any).title || 'Listing'}
            name={(listing as any).title}
            direction={photoDirection}
            priority={false}
            fullScreen={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-auto">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.55}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handleUnifiedPointerDown}
        onPointerMove={handleUnifiedPointerMove}
        onPointerUp={handleUnifiedPointerUp}
        onPointerCancel={handleUnifiedPointerUp}
        initial={{ scale: 0.97, opacity: 0.85 }}
        animate={{
          scale: 1,
          opacity: 1,
          transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 }
        }}
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative w-full h-full overflow-hidden rounded-[2.5rem] border-none gpu-ultra"
        style={{
          x,
          y,
          rotate: cardRotate,
          opacity: cardOpacity,
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          boxShadow: '0 25px 80px -15px rgba(0,0,0,0.7), 0 10px 30px -10px rgba(0,0,0,0.5)',
          background: '#000',
        }}
      >
        <div 
          ref={containerRef as any}
          className="absolute inset-0 overflow-hidden" 
          onClick={handleImageTap}
        >
          {currentImage === 'video_attachment' && (listing as any).video_url ? (
            <video
              src={(listing as any).video_url}
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 1 }}
            />
          ) : (
            <CardImage
              src={currentImage}
              alt={(listing as any).title || 'Listing'}
              name={(listing as any).title}
              direction={photoDirection}
              priority={isTop}
              fullScreen={true}
              animate={!isZoomed}
            />
          )}

          <div
            className="absolute top-0 left-0 right-0 pointer-events-none z-20 transition-opacity duration-200"
            style={{
              height: '42%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.2) 65%, transparent 100%)',
              opacity: isZoomed ? 0 : 1,
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 transition-opacity duration-200"
            style={{
              height: '65%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.4) 55%, transparent 100%)',
              opacity: isZoomed ? 0 : 1,
            }}
          />
          
          {imageCount > 1 && (
            <div
              className="absolute top-[calc(var(--safe-top,0px)+16px)] inset-x-0 flex justify-center z-20 pointer-events-none transition-opacity duration-150"
              style={{ opacity: isZoomed ? 0 : 1 }}
            >
              <div className="flex gap-1.5 w-full max-w-[140px] px-2">
                {Array.from({ length: imageCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-[2.5px] flex-1 rounded-full overflow-hidden bg-white/25"
                  >
                    <motion.div 
                      animate={{ 
                        x: idx < currentImageIndex ? '0%' : idx === currentImageIndex ? '0%' : '-100%',
                        opacity: idx === currentImageIndex ? 1 : 0.5
                      }}
                      className="w-full h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <motion.div className="absolute top-10 right-6 z-50 pointer-events-none" style={{ opacity: likeOpacity }}>
          <div className="flex flex-col items-center gap-1.5" style={{ transform: 'rotate(15deg)' }}>
             <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-orange-500/20 border-2 border-orange-500 shadow-[0_0_20px_rgba(255,87,34,0.5)]">
               <ThumbsUp className="w-9 h-9 text-orange-500" fill="currentColor" strokeWidth={0} />
             </div>
          </div>
        </motion.div>

        <motion.div className="absolute top-10 left-6 z-50 pointer-events-none" style={{ opacity: passOpacity }}>
          <div className="flex flex-col items-center gap-1.5" style={{ transform: 'rotate(-15deg)' }}>
             <div className="px-5 py-2.5 rounded-xl border-3 border-rose-500 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
               <span className="font-black text-4xl text-rose-500">NOPE</span>
             </div>
          </div>
        </motion.div>

        <div
          className="absolute left-5 right-5 bottom-[calc(var(--bottom-nav-height,72px)+100px)] z-30 pointer-events-none transition-opacity duration-150"
          style={{ opacity: isZoomed ? 0 : 1 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex rounded-full px-3 py-1 bg-black/80 border border-white/10 shadow-lg">
                <CompactRatingDisplay aggregate={ratingAggregate as any} isLoading={isRatingLoading} showReviews={false} className="text-white" />
              </div>
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
              if ((listing as any).category === 'vehicle') {
                return (
                  <VehicleCardInfo
                    price={(listing as any).price || 0}
                    priceType={(listing as any).listing_type === 'sale' ? 'sale' : (listing as any).rental_duration_type === 'monthly' ? 'month' : 'day'}
                    make={(listing as any).vehicle_brand}
                    model={(listing as any).vehicle_model}
                    year={(listing as any).year}
                    location={(listing as any).city}
                    isVerified={(listing as any).has_verified_documents}
                    photoIndex={currentImageIndex}
                    className="!text-white !space-y-0"
                  />
                );
              }
              return (
                <PropertyCardInfo
                  price={(listing as any).price || 0}
                  priceType={(listing as any).listing_type === 'sale' ? 'sale' : (listing as any).rental_duration_type === 'monthly' ? 'month' : 'night'}
                  propertyType={(listing as any).property_type}
                  beds={(listing as any).beds}
                  baths={(listing as any).baths}
                  location={(listing as any).city}
                  isVerified={(listing as any).has_verified_documents}
                  photoIndex={currentImageIndex}
                  className="!text-white !space-y-0"
                />
              );
            })()}
          </motion.div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10 transition-opacity duration-200"
          style={{
            height: '65%',
            background: isLight
              ? 'linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.06) 65%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.06) 65%, transparent 100%)',
            opacity: isZoomed ? 0 : 1,
          }}
        />

        {(listing as any).has_verified_documents && (
          <div className="absolute top-16 left-6 z-40 transition-opacity duration-150" style={{ opacity: isZoomed ? 0 : 1 }}>
             <div className="relative px-3 py-1.5 rounded-full flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10">
               <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Verified</span>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
});

SimpleSwipeCardComponent.displayName = 'SimpleSwipeCard';
export const SimpleSwipeCard = memo(SimpleSwipeCardComponent);
