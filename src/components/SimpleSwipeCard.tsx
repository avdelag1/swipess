/**
 * TINDER-STYLE SWIPE CARD — Nexus Edition
 *
 * Axis-locked swipe card with strict story-feed movement.
 * Card only travels straight up/down for browsing or straight left/right for like/pass.
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
import { ThumbsUp, ThumbsDown, Flame, Flag, Share2 } from 'lucide-react';
import { PhotoPositionIndicators } from '@/components/swipe/PhotoPositionIndicators';
import { GestureHints } from '@/components/swipe/GestureHints';
import { toggleChrome } from '@/hooks/useChromeReveal';

export interface SimpleSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 260;
const SKIP_THRESHOLD = 70;
const SKIP_VELOCITY = 240;
const FALLBACK_PLACEHOLDER = '';
type DragAxis = 'x' | 'y' | null;

const getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;

const SPRING_CONFIGS = {
  SILK: { stiffness: 500, damping: 25, mass: 0.4 },
};

const ACTIVE_SPRING = SPRING_CONFIGS.SILK;

interface SimpleSwipeCardProps {
  listing: Listing | MatchedListing | MatchedClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onSkip?: () => void;
  onSkipBack?: () => void;
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
  onSkip,
  onSkipBack,
  onInsights,
  isTop = true,
  externalX,
  externalY,
  onDragStart,
  onReport,
  onShare,
}, ref) => {
  const { isLight } = useAppTheme();
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastListingIdRef = useRef(listing.id || (listing as any).user_id);
  const dragControls = useDragControls();
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);
  const dragAxisRef = useRef<DragAxis>(null);

  const _internalX = useMotionValue(0);
  const _internalY = useMotionValue(0);
  const x = externalX ?? _internalX;
  const y = externalY ?? _internalY;

  // Strict story-feed motion: horizontal = like/pass, vertical = browse next card.
  // Vertical browse keeps the card fully opaque so up/down feels like a clean
  // page-turn — the underlying card only pops in once we commit. Horizontal
  // swipes get a subtle late fade so like/pass still feels weighted.
  const cardOpacity = useTransform(
    [x, y] as any,
    ([cx, cy]: any) => {
      const ax = Math.abs(cx);
      // Horizontal: stay solid until ~60% of threshold, then fade lightly.
      const fadeX = ax <= SWIPE_THRESHOLD * 0.6
        ? 0
        : Math.min(1, (ax - SWIPE_THRESHOLD * 0.6) / (SWIPE_THRESHOLD * 1.2)) * 0.25;
      // Vertical: NO fade during browse — card stays opaque the whole way.
      return 1 - fadeX;
    }
  );
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);
  const skipOpacity = useTransform(y as MotionValue<number>, (v: number) => Math.min(1, Math.abs(v) / SKIP_THRESHOLD));

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState<'left' | 'right'>('right');
  const floatingIconFilter = isLight
    ? 'drop-shadow(0 1px 1px hsl(var(--background) / 0.95)) drop-shadow(0 2px 6px hsl(var(--foreground) / 0.42))'
    : 'drop-shadow(0 2px 7px hsl(var(--background) / 0.9))';

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
  const { containerRef, pointerHandlers: magnifierPointerHandlers, isActive: isMagnifierActive, wasActive: wasMagnifierActive, isHoldPending: isMagnifierHoldPending } = useMagnifier({
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
      // Start drag the instant we detect real movement. Cancel the magnifier
      // hold so vertical/horizontal browse never stalls waiting on the
      // 380ms hold-to-zoom timer.
      if (dx > 6 || dy > 6) {
        magnifierPointerHandlers.onPointerUp(e); 
        dragStartedRef.current = true;
        isDragging.current = true;
        dragControls.start((storedPointerEventRef.current as any).nativeEvent);
        return;
      }
    }
    // Forward to magnifier so its hold detection sees movement
    magnifierPointerHandlers.onPointerMove(e);
  }, [isMagnifierActive, isMagnifierHoldPending, magnifierPointerHandlers, dragControls]);

  const handleUnifiedPointerUp = useCallback((e: React.PointerEvent) => {
    storedPointerEventRef.current = null;
    magnifierPointerHandlers.onPointerUp(e);
  }, [magnifierPointerHandlers]);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    dragAxisRef.current = null;
    triggerHaptic('light');
    onDragStart?.();
  }, [onDragStart]);

  const handleDirectionLock = useCallback((axis: 'x' | 'y') => {
    dragAxisRef.current = axis;
    if (axis === 'x') y.set(0);
    if (axis === 'y') x.set(0);
  }, [x, y]);

  const handleDrag = useCallback(() => {
    if (dragAxisRef.current === 'x') y.set(0);
    if (dragAxisRef.current === 'y') x.set(0);
  }, [x, y]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const dx = info.offset.x;
    const dy = info.offset.y;
    const vx = info.velocity.x;
    const vy = info.velocity.y;
    const axis = dragAxisRef.current ?? (Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y');

    const horizCommit = axis === 'x' && (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD);
    const vertCommit = axis === 'y' && (Math.abs(dy) > SKIP_THRESHOLD || Math.abs(vy) > SKIP_VELOCITY);

    if (horizCommit) {
      const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';
      hasExited.current = true;
      isExitingRef.current = true;
      triggerHaptic(direction === 'right' ? 'success' : 'warning');
      const exitX = direction === 'right' ? (window.innerWidth || 600) * 1.2 : -(window.innerWidth || 600) * 1.2;
      animate(x, exitX, { type: 'tween', duration: 0.24, ease: [0.32, 0, 0.67, 0] });
      animate(y, 0, { type: 'tween', duration: 0.18, ease: [0.22, 1, 0.36, 1] });
      setTimeout(() => onSwipe(direction), 220);
    } else if (vertCommit && (onSkip || onSkipBack)) {
      const dir = dy > 0 ? 1 : -1;
      hasExited.current = true;
      isExitingRef.current = true;
      triggerHaptic('light');
      // Cinematic vertical exit: card vanishes back into the deck while next card rises up.
      const exitY = dir * (window.innerHeight || 800) * 0.85;
      animate(y, exitY, { duration: 0.32, ease: [0.22, 1, 0.36, 1] });
      animate(x, 0, { duration: 0.18, ease: [0.22, 1, 0.36, 1] });
      setTimeout(() => {
        if (dir > 0) onSkip?.();
        else onSkipBack?.();
      }, 300);
    } else {
      animate(x, 0, { type: 'spring', ...ACTIVE_SPRING });
      animate(y, 0, { type: 'spring', ...ACTIVE_SPRING });
    }
    setTimeout(() => { isDragging.current = false; dragAxisRef.current = null; }, 100);
  }, [onSwipe, onSkip, onSkipBack, x, y]);

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
    } else {
      toggleChrome();
      triggerHaptic('light');
    }
  }, [imageCount, onInsights, isMagnifierActive, wasMagnifierActive]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    if (hasExited.current) return;
    hasExited.current = true;
    isExitingRef.current = true;
    triggerHaptic(direction === 'right' ? 'success' : 'warning');
    // 'right' = like → fly RIGHT, 'left' = pass → fly LEFT (Tinder-style)
    const exitDist = typeof window !== 'undefined' ? window.innerWidth * 1.2 : 900;
    const exitX = direction === 'right' ? exitDist : -exitDist;
    let swipeFired = false;
    const fireSwipe = () => {
      if (swipeFired) return;
      swipeFired = true;
      isExitingRef.current = false;
      onSwipe(direction);
    };
    animate(y, 0, { type: 'tween', duration: 0.14, ease: [0.22, 1, 0.36, 1] });
    animate(x, exitX, { type: 'tween', duration: 0.26, ease: [0.32, 0, 0.67, 0], onComplete: fireSwipe });
    setTimeout(fireSwipe, 300);
  }, [onSwipe, x, y]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  if (!isTop) {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none', borderRadius: 28 }}>
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
        dragDirectionLock
        dragMomentum={false}
        dragConstraints={{ left: -1200, right: 1200, top: -1200, bottom: 1200 }}
        dragElastic={1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDirectionLock={handleDirectionLock}
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
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative w-full h-full overflow-hidden border-none gpu-ultra"
        style={{
          x,
          y,
          opacity: cardOpacity,
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          borderRadius: 28,
          boxShadow: 'none',
          background: 'hsl(var(--swipe-deck-frame))',
        }}
      >
        <div 
          ref={containerRef as any}
          className="absolute inset-0 overflow-hidden" 
          style={{ borderRadius: 'inherit', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
          onClick={handleImageTap}
          onDragStart={(event) => event.preventDefault()}
          onContextMenu={(event) => event.preventDefault()}
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
              height: '28%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.2) 65%, transparent 100%)',
              opacity: isZoomed ? 0 : 1,
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 transition-opacity duration-200"
            style={{
              height: '42%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 80%, transparent 100%)',
              opacity: isZoomed ? 0 : 1,
            }}
          />
          
          <PhotoPositionIndicators count={imageCount} currentIndex={currentImageIndex} hidden={isZoomed} />
        </div>

        <GestureHints hidden={isZoomed} />

        <motion.div className="absolute top-10 right-6 z-50 pointer-events-none rotate-[-12deg]" style={{ opacity: likeOpacity }}>
          <div className="flex flex-col items-center gap-1.5">
             <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-orange-500/20 border-2 border-orange-500 shadow-[0_0_20px_rgba(255,87,34,0.5)]">
               <ThumbsUp className="w-9 h-9 text-orange-500" fill="currentColor" strokeWidth={0} />
             </div>
          </div>
        </motion.div>

        <motion.div className="absolute top-10 left-6 z-50 pointer-events-none rotate-[12deg]" style={{ opacity: passOpacity }}>
          <div className="flex flex-col items-center gap-1.5">
             <div className="px-5 py-2.5 rounded-xl border-3 border-rose-500 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
               <span className="font-black text-4xl text-rose-500">NOPE</span>
             </div>
          </div>
        </motion.div>

        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none" style={{ opacity: skipOpacity }}>
          <div className="px-4 py-2 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
            <span className="text-white text-sm font-bold tracking-widest uppercase">Next</span>
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
                    priceType={(listing as any).listing_type === 'rental' ? ((listing as any).rental_duration_type === 'monthly' ? 'month' : 'day') : 'sale'}
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
                  priceType={(listing as any).listing_type === 'rental' ? ((listing as any).rental_duration_type === 'monthly' ? 'month' : 'night') : 'sale'}
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
            height: '42%',
            background: isLight
              ? 'linear-gradient(to top, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 35%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.32) 35%, transparent 100%)',
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

        {isTop && (onReport || onShare) && (
          <div
            className="absolute right-5 bottom-[calc(var(--bottom-nav-height,72px)+96px)] z-40 flex flex-col items-end gap-3 transition-opacity duration-150"
            style={{ opacity: isZoomed ? 0 : 1 }}
          >
            {onShare && (
              <button
                data-no-cinematic
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onShare(); }}
                aria-label="Share listing"
                className="w-9 h-9 flex items-center justify-center bg-transparent border-0 shadow-none active:scale-90 transition-all duration-150"
                style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
              >
                <Share2 className="w-[18px] h-[18px]" strokeWidth={2.2} style={{ color: '#FFFFFF', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))' }} />
              </button>
            )}
            {onReport && (
              <button
                data-no-cinematic
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onReport(); }}
                aria-label="Report listing"
                className="w-9 h-9 flex items-center justify-center bg-transparent border-0 shadow-none active:scale-90 transition-all duration-150"
                style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
              >
                <Flag className="w-[18px] h-[18px]" strokeWidth={2.2} style={{ color: '#FFFFFF', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))' }} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
});

SimpleSwipeCardComponent.displayName = 'SimpleSwipeCard';
export const SimpleSwipeCard = memo(SimpleSwipeCardComponent);
