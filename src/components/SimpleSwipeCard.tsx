/**
 * TINDER-STYLE SWIPE CARD â€” Swipes Edition
 *
 * Axis-locked swipe card with strict story-feed movement.
 * Card only travels straight up/down for browsing or straight left/right for like/pass.
 * 
 * KEY FEATURES:
 * - Free XY movement (diagonal swipes)
 * - Rotation based on drag position (pivot from bottom)
 * - Spring physics for snap-back and exit
 * - Next card visible underneath with scale/opacity anticipation
 * - Advanced "Swipes" Zoom (Hold to Magnify)
 */

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { animate, AnimatePresence, motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { Listing } from '@/hooks/useListings';
import { MatchedClientProfile, MatchedListing } from '@/hooks/useSmartMatching';
import { useMagnifier } from '@/hooks/useMagnifier';
import { ClientCardInfo, PropertyCardInfo, ServiceCardInfo, VehicleCardInfo } from '@/components/ui/CardInfoHierarchy';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useListingRatingAggregate } from '@/hooks/useRatingSystem';
import CardImage from '@/components/CardImage';
import { LoopVideo } from '@/components/video/LoopVideo';
import { imageCache } from '@/lib/swipe/cardImageCache';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { BarChart3, Flag, MessageCircle, Share2, Undo2 } from 'lucide-react';
import { PhotoPositionIndicators } from '@/components/swipe/PhotoPositionIndicators';
import { GestureHints } from '@/components/swipe/GestureHints';
import { revealChrome, useChromeReveal } from '@/hooks/useChromeReveal';
import { EXIT_SPRING, SNAP_BACK_SPRING } from '@/components/swipe/SwipeConstants';

export interface SimpleSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;
const FALLBACK_PLACEHOLDER = '';



interface SimpleSwipeCardProps {
  listing: Listing | MatchedListing | MatchedClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onCardTap?: () => void;
  onInsights?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onMessage?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isTop?: boolean;
  onDragStart?: () => void;
  disableDrag?: boolean;
  fullScreen?: boolean;
}

// ActionRailButton now lives in the shared <GlassIconButton /> primitive
// (src/components/ui/GlassIconButton.tsx) so the swipe-card rail, header, nav
// and other floating controls share one frosted-glass + outlined-icon look.

const SimpleSwipeCardComponent = forwardRef<SimpleSwipeCardRef, SimpleSwipeCardProps>(({
  listing,
  onSwipe,
  onCardTap,
  onInsights,
  isTop = true,
  onDragStart,
  onReport,
  onShare,
  onMessage,
  onUndo,
  canUndo = false,
  disableDrag,
  fullScreen = false,
}, ref) => {
  const { isLight } = useAppTheme();
   
  const { isRailVisible } = useChromeReveal();
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastListingIdRef = useRef(listing.id || (listing as any).user_id);
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Strict story-feed motion: horizontal = like/pass, vertical = browse next card.
  // Vertical browse keeps the card fully opaque so up/down feels like a clean
  // page-turn â€” the underlying card only pops in once we commit. Horizontal
  // swipes get a subtle late fade so like/pass still feels weighted.
  const cardOpacity = useTransform(
    [x, y] as any,
    ([_cx, _cy]: any) => {
      return 1;
    }
  );
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);
  const rotate = useTransform(x, [-800, 800], [-25, 25]);
  const scale = useTransform(x, [-800, 0, 800], [0.95, 1, 0.95]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState<'left' | 'right'>('right');

  const images = useMemo(() => {
    const extract = (raw: unknown): string | null => {
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        return trimmed && trimmed.toLowerCase() !== 'null' ? trimmed : null;
      }
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        return extract(obj.url) || extract(obj.image_url) || extract(obj.src) || extract(obj.publicUrl) || null;
      }
      return null;
    };

    const collect = (input: unknown): string[] => {
      if (!Array.isArray(input)) return [];
      const out: string[] = [];
      for (const item of input) {
        const url = extract(item);
        if (url) out.push(url);
      }
      return out;
    };

    let result: string[] = [];
    const isProfile = (listing as any).profile_images || (listing as any).name;
    if (isProfile) {
      result = collect((listing as any).profile_images);
      if (result.length === 0) {
        const avatar = extract((listing as any).avatar_url);
        if (avatar) result.push(avatar);
      }
    } else {
      const video = extract((listing as any).video_url);
      if (video) result.push(video);
      const listingImages = collect((listing as any).images);
      if (listingImages.length > 0) {
        result = [...result, ...listingImages];
      } else {
        const single = extract((listing as any).image_url);
        if (single) result.push(single);
      }
    }

    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const url of result) {
      if (!seen.has(url)) {
        seen.add(url);
        deduped.push(url);
      }
    }

    return deduped.length === 0 ? [FALLBACK_PLACEHOLDER] : deduped;
  }, [listing]);

  const imageCount = images.length;

  useEffect(() => {
    if (!isTop || images.length <= 1) return;
    images.forEach((imageUrl) => {
      if (!imageUrl || imageUrl === FALLBACK_PLACEHOLDER) return;
      const optimizedUrl = getCardImageUrl(imageUrl);
      if (imageCache.has(optimizedUrl)) return;
      const img = new Image();
      (img as any).fetchPriority = 'high';
      img.decoding = 'async';
      img.onload = async () => {
        try {
          if ('decode' in img) await img.decode();
        } catch (_e) { /* ignore */ }
        imageCache.set(optimizedUrl, true);
      };
      img.src = optimizedUrl;
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

  useEffect(() => {
    if (isTop) {
      hasExited.current = false;
      isExitingRef.current = false;
    }
  }, [isTop]);

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
      if (dx > 3 || dy > 3) {
        magnifierPointerHandlers.onPointerUp(e);
        dragStartedRef.current = true;
        isDragging.current = true;
        return;
      }
    }
    magnifierPointerHandlers.onPointerMove(e);
  }, [isMagnifierActive, isMagnifierHoldPending, magnifierPointerHandlers]);

  const handleUnifiedPointerUp = useCallback((e: React.PointerEvent) => {
    storedPointerEventRef.current = null;
    magnifierPointerHandlers.onPointerUp(e);
  }, [magnifierPointerHandlers]);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    triggerHaptic('light');
    onDragStart?.();
  }, [onDragStart]);

  // SPEED OF LIGHT: Auto-reveal protocol
  // When a card becomes the top card, briefly reveal the chrome (header/nav/buttons)
  // so the user sees the available controls before they smoothly fade away.
  useEffect(() => {
    if (isTop && !isZoomed) {
      revealChrome();
    }
  }, [isTop, isZoomed]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (hasExited.current) return;
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const horizCommit = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD;
    if (horizCommit) {
      const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';
      hasExited.current = true;
      isExitingRef.current = true;
      triggerHaptic(direction === 'right' ? 'success' : 'warning');
      const exitX = direction === 'right' ? (window.innerWidth || 600) * 1.2 : -(window.innerWidth || 600) * 1.2;
      y.set(0);
      let swipeFired = false;
      const fireSwipe = () => {
        if (swipeFired) return;
        swipeFired = true;
        isExitingRef.current = false;
        onSwipe(direction);
      };
      animate(x, exitX, { ...EXIT_SPRING, velocity: info.velocity.x, onComplete: fireSwipe });
      setTimeout(fireSwipe, 800);
    } else {
      animate(x, 0, { ...SNAP_BACK_SPRING, velocity: info.velocity.x });
      animate(y, 0, SNAP_BACK_SPRING);
    }
    isDragging.current = false;
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
    } else {
      revealChrome();
      onCardTap?.();
      triggerHaptic('light');
    }
  }, [imageCount, onCardTap, isMagnifierActive, wasMagnifierActive]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    if (hasExited.current) return;
    hasExited.current = true;
    isExitingRef.current = true;
    triggerHaptic(direction === 'right' ? 'success' : 'warning');
    // 'right' = like â†’ fly RIGHT, 'left' = pass â†’ fly LEFT (Tinder-style)
    const exitDist = typeof window !== 'undefined' ? window.innerWidth * 1.2 : 900;
    const exitX = direction === 'right' ? exitDist : -exitDist;
    let swipeFired = false;
    const fireSwipe = () => {
      if (swipeFired) return;
      swipeFired = true;
      isExitingRef.current = false;
      onSwipe(direction);
    };
    animate(y, 0, { ...SNAP_BACK_SPRING });
    animate(x, exitX, { ...EXIT_SPRING, onComplete: fireSwipe });
    setTimeout(fireSwipe, 400);
  }, [onSwipe, x, y]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  const preventDrag = useCallback((e: React.DragEvent) => e.preventDefault(), []);
  const preventContextMenuClick = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  const actionButtons = useMemo(() => [
    { icon: Share2, onClick: onShare, label: 'Share' },
    { icon: MessageCircle, onClick: onMessage, label: 'Message' },
    { icon: BarChart3, onClick: onInsights, label: 'Insights' },
    { icon: Flag, onClick: onReport, label: 'Report' },
  ], [onShare, onMessage, onInsights, onReport]);

  return (
    <div className={cn("absolute inset-0 flex flex-col", isTop ? "pointer-events-auto" : "pointer-events-none")}>
      <motion.div
        drag={disableDrag ? false : (isTop ? 'x' : false)}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 350, bounceDamping: 32 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handleUnifiedPointerDown}
        onPointerMove={handleUnifiedPointerMove}
        onPointerUp={handleUnifiedPointerUp}
        onPointerCancel={handleUnifiedPointerUp}
        className={cn("swipe-live-card flex-1 select-none touch-none relative w-full h-full overflow-hidden border-none gpu-ultra", isTop && !disableDrag ? "cursor-grab active:cursor-grabbing" : "")}
        style={{
          x,
          y,
          rotate: isTop ? rotate : 0,
          scale: isTop ? scale : 0.95,
          opacity: isTop ? cardOpacity : 0.6,
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)',
          transformOrigin: '50% 120%', // Pivot from bottom so it feels like a heavy physical card
          backfaceVisibility: 'hidden',
          borderRadius: fullScreen ? 0 : 48,
          boxShadow: isTop 
            ? '0 25px 50px -12px rgba(0,0,0,0.45), 0 10px 30px -5px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 4px 10px rgba(0,0,0,0.1)',
          background: 'hsl(var(--swipe-deck-frame))',
          WebkitMaskImage: fullScreen ? 'none' : '-webkit-linear-gradient(white, white)',
        }}
      >
        <div 
          ref={containerRef as any}
          className="absolute inset-0 overflow-hidden" 
          style={{ borderRadius: 'inherit', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
          onClick={handleImageTap}
          onDragStart={preventDrag}
          onContextMenu={preventContextMenuClick}
        >
          {images.map((imgUrl, idx) => {
            const isActive = currentImageIndex === idx;
            if (imgUrl === 'video_attachment' && (listing as any).video_url) {
              return (
                <div key={`video-${idx}`} className="absolute inset-0 transition-opacity duration-200 ease-in-out" style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none', zIndex: isActive ? 2 : 1 }}>
                  <LoopVideo
                    src={(listing as any).video_url}
                    className="absolute inset-0 w-full h-full object-cover"
                    active={isTop && isActive}
                  />
                </div>
              );
            }
            return (
              <div key={`img-${idx}`} className="absolute inset-0 transition-opacity duration-200 ease-in-out bg-black" style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none', zIndex: isActive ? 2 : 1 }}>
                <CardImage
                  src={imgUrl}
                  alt={(listing as any).title || 'Listing'}
                  name={(listing as any).title}
                  direction={photoDirection}
                  priority={idx === 0 || idx === currentImageIndex}
                  fullScreen={true}
                  animate={!isZoomed && isActive}
                />
              </div>
            );
          })}
          {isTop && (
            <>
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 transition-opacity duration-200"
                style={{
                  height: '42%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 80%, transparent 100%)',
                  opacity: isZoomed ? 0 : 1,
                }}
              />
              <PhotoPositionIndicators count={imageCount} currentIndex={currentImageIndex} hidden={isZoomed} />
            </>
          )}
        </div>



        {isTop && (
          <>
            <GestureHints hidden={isZoomed} />

        <motion.div className="absolute top-10 right-6 z-50 pointer-events-none rotate-[-12deg]" style={{ opacity: likeOpacity }}>
          <div className="flex flex-col items-center gap-1.5">
             <div className="px-5 py-2.5 rounded-xl border-3 border-orange-500 bg-orange-500/20 shadow-[0_0_20px_rgba(255,87,34,0.5)]">
               <span className="font-black text-4xl text-orange-500 tracking-tighter whitespace-nowrap">I LIKE IT</span>
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


        <div
          className="absolute left-5 right-5 z-30 pointer-events-none transition-opacity duration-150"
          style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 16px)', opacity: isZoomed ? 0 : 1 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="glass-pill inline-flex px-3 py-1">
                <CompactRatingDisplay aggregate={ratingAggregate as any} isLoading={isRatingLoading} showReviews={false} className="text-white" />
              </div>
            </div>

            <div
              className="inline-flex flex-col w-fit max-w-full px-4 py-3 rounded-3xl"
              style={{
                background: 'rgba(20, 20, 24, 0.55)',
                boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.55)',
                color: '#FFFFFF',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
              }}
            >
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
                const cat = (listing as any).category;
                if (cat === 'vehicle' || cat === 'motorcycle' || cat === 'bicycle') {
                  return (
                    <VehicleCardInfo
                      title={(listing as any).title}
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
                if ((listing as any).category === 'services' || (listing as any).category === 'worker') {
                  return (
                    <ServiceCardInfo
                      title={(listing as any).title}
                      hourlyRate={(listing as any).price || undefined}
                      pricingUnit={(listing as any).pricing_unit || 'hr'}
                      serviceName={(listing as any).service_type || (listing as any).property_type || (listing as any).title || 'Service'}
                      name={(listing as any).name}
                      location={(listing as any).city}
                      isVerified={(listing as any).has_verified_documents}
                      photoIndex={currentImageIndex}
                      className="!text-white !space-y-0"
                    />
                  );
                }
                return (
                  <PropertyCardInfo
                    title={(listing as any).title}
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
            </div>
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
          <div className="absolute left-6 z-40 transition-opacity duration-150" style={{ top: 'calc(var(--safe-top, 0px) + var(--top-bar-height, 72px) + 12px)', opacity: isZoomed ? 0 : 1 }}>
             <div className="glass-pill px-3 py-1.5 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Verified</span>
             </div>
          </div>
        )}

          </>
        )}
      </motion.div>

      {/* Action rail lives OUTSIDE the draggable motion.div so Framer Motion's
          native drag listener cannot intercept the button pointer events. */}
      <AnimatePresence>
        {isTop && !isZoomed && isRailVisible && (
          <motion.div
            data-no-cinematic
            data-no-pull-dismiss
            initial={{ opacity: 0, x: 18, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-3 z-50 pointer-events-auto"
            style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 24px)' }}
          >
            <div
              className="flex flex-col gap-1.5 p-1.5 rounded-full"
              style={{
                // Solid rail — sits over the moving card, so no backdrop-filter
                // (it would re-blur the card pixels every frame and tile).
                background: 'rgba(24, 24, 28, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                boxShadow:
                  '0 8px 32px -6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {actionButtons.map((btn, idx) => (
                <GlassIconButton
                  key={idx}
                  icon={btn.icon}
                  onClick={btn.onClick}
                  label={btn.label}
                  tone="onPhoto"
                  size="md"
                  guardSwipe
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Button */}
      <AnimatePresence>
        {isTop && canUndo && !isZoomed && isRailVisible && onUndo && (
          <motion.div
            data-no-cinematic
            data-no-pull-dismiss
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-50 pointer-events-auto"
            style={{ 
              top: 'calc(var(--safe-top, 0px) + 16px)', 
              right: '16px' 
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onUndo(); }}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.4))' }}
            >
              <Undo2 className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SimpleSwipeCardComponent.displayName = 'SimpleSwipeCard';
export const SimpleSwipeCard = memo(SimpleSwipeCardComponent);
