/**
 * TINDER-STYLE OWNER SWIPE CARD ├óÔé¼ÔÇØ Swipes Edition
 *
 * Axis-locked owner swipe card with strict story-feed movement.
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
import { BarChart3, ChevronLeft, Crown, Flag, Map, MessageCircle, Mic, RotateCcw, Share2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/state/modalStore';
import { useMagnifier } from '@/hooks/useMagnifier';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { LoopVideo } from '@/components/video/LoopVideo';
import { useUserRatingAggregateEnhanced } from '@/hooks/useRatingSystem';
import { ClientCardInfo } from '@/components/ui/CardInfoHierarchy';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { SwipeMatchMeter } from '@/components/swipe/SwipeMatchMeter';
import useAppTheme from '@/hooks/useAppTheme';
import { imageCache } from '@/lib/swipe/cardImageCache';
import SharedCardImage from '@/components/CardImage';
import { PhotoPositionIndicators } from '@/components/swipe/PhotoPositionIndicators';
import { GestureHints } from '@/components/swipe/GestureHints';
import { revealChrome, useChromeReveal } from '@/hooks/useChromeReveal';
import { EXIT_SPRING, SNAP_BACK_SPRING } from '@/components/swipe/SwipeConstants';

export interface SimpleOwnerSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;
const FALLBACK_PLACEHOLDER = '';



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
  budget_min?: number | null;
  budget_max?: number | null;
  monthly_income?: number | null;
  verified?: boolean | null;
  lifestyle_tags?: string[] | null;
  preferred_listing_types?: string[] | null;
}

interface SimpleOwnerSwipeCardProps {
  profile: ClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap?: () => void;
  onInsights?: () => void;
  onMessage?: () => void;
  isTop?: boolean;
  onDragStart?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onSoon?: () => void;
  onBack?: () => void;
  fullScreen?: boolean;
  disableDrag?: boolean;
  renderTopRail?: React.ReactNode;
}

// ActionRailButton now lives in the shared <GlassIconButton /> primitive
// (src/components/ui/GlassIconButton.tsx) so the swipe-card rail, header, nav
// and other floating controls share one frosted-glass + outlined-icon look.

const SimpleOwnerSwipeCardComponent = forwardRef<SimpleOwnerSwipeCardRef, SimpleOwnerSwipeCardProps>(({
  profile,
  onSwipe,
  onTap: onTap,
  onInsights,
  isTop = false,
  onDragStart,
  onReport,
  onShare,
  onMessage,
  onUndo,
  canUndo = false,
  onSoon: _onSoon,
  onBack,
  disableDrag,
  fullScreen = false,
  renderTopRail,
}, ref) => {
  const { isRailVisible } = useChromeReveal();
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastProfileIdRef = useRef(profile?.user_id || '');
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);
  const { isLight } = useAppTheme();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const cardOpacity = useTransform([x, y] as any, () => 1);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);
  const rotate = useTransform(x, [-800, 800], [-25, 25]);
  const scale = useTransform(x, [-800, 0, 800], [0.95, 1, 0.95]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState<'left' | 'right'>('right');

  const images = useMemo(() => {
    if (!profile) return [FALLBACK_PLACEHOLDER];
    return Array.isArray(profile.profile_images) && profile.profile_images.length > 0
      ? profile.profile_images
      : [FALLBACK_PLACEHOLDER];
  }, [profile]);

  const imageCount = images.length;
  const videoUrl = (profile as any)?.video_url as string | null | undefined;

  useEffect(() => {
    if (!isTop || !images.length) return;
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
  }, [isTop, images, profile?.user_id]);

  useEffect(() => {
    if (isTop) {
      hasExited.current = false;
      isExitingRef.current = false;
    }
  }, [isTop]);

  useEffect(() => {
    if (!profile?.user_id) return;
    if (profile.user_id !== lastProfileIdRef.current) {
      lastProfileIdRef.current = profile.user_id;
      if (!isExitingRef.current) {
        hasExited.current = false;
        setCurrentImageIndex(0);
        x.set(0);
        y.set(0);
      }
    }
  }, [profile?.user_id, x, y]);

  useEffect(() => {
    if (isTop && !isExitingRef.current) {
      revealChrome();
    }
  }, [isTop]);

  const [isZoomed, setIsZoomed] = useState(false);
  const { containerRef, pointerHandlers: magnifierPointerHandlers, isActive: isMagnifierActive, wasActive: wasMagnifierActive, isHoldPending: isMagnifierHoldPending } = useMagnifier({
    scale: 3.2,        // deeper zoom — was 2.8
    holdDelay: 240,    // quicker to trigger — was 380
    enabled: isTop,
    onActiveChange: setIsZoomed,
  });

  const { data: ratingAggregate, isLoading: isRatingLoading } = useUserRatingAggregateEnhanced(profile?.user_id);

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
    const clickY = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

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
      if (clickY > height * 0.33 && clickY < height * 0.67) {
        onTap?.();
      }
      triggerHaptic('light');
    }
  }, [imageCount, onTap, isMagnifierActive, wasMagnifierActive]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    if (hasExited.current) return;
    hasExited.current = true;
    isExitingRef.current = true;
    triggerHaptic(direction === 'right' ? 'success' : 'warning');
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

  if (!profile?.user_id) return null;

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
          x, y, rotate: isTop ? rotate : 0, scale: isTop ? scale : 0.95, opacity: isTop ? cardOpacity : 0.6,
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)',
          transformOrigin: '50% 120%',
          backfaceVisibility: 'hidden',
          borderRadius: fullScreen ? 0 : 48,
          boxShadow: isTop
            ? '0 25px 50px -12px rgba(0,0,0,0.45), 0 10px 30px -5px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 4px 10px rgba(0,0,0,0.1)',
          background: 'hsl(var(--swipe-deck-frame))',
        }}
      >
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 'inherit', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
          onClick={handleImageTap}
          onDragStart={preventDrag}
          onContextMenu={preventContextMenuClick}
        >
          {images.map((imgUrl, idx) => {
            const isActive = currentImageIndex === idx;
            const isVideo = !!videoUrl && idx === 0;
            if (isVideo) {
              return (
                <div key={`video-${idx}`} className="absolute inset-0 transition-opacity duration-200 ease-in-out" style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none', zIndex: isActive ? 2 : 1 }}>
                  <LoopVideo src={videoUrl!} className="absolute inset-0 w-full h-full object-cover" active={isTop && isActive} />
                </div>
              );
            }
            return (
              <div key={`img-${idx}`} className="absolute inset-0 transition-opacity duration-200 ease-in-out bg-black" style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none', zIndex: isActive ? 2 : 1 }}>
                <SharedCardImage src={imgUrl} alt={profile.name || 'Client'} name={profile.name} direction={photoDirection} priority={idx === 0 || idx === currentImageIndex} fullScreen={true} animate={!isZoomed && isActive} />
              </div>
            );
          })}
          {isTop && (
            <>
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 transition-opacity duration-200"
                  style={{ height: '42%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 80%, transparent 100%)', opacity: isZoomed ? 0 : 1 }} />
              <PhotoPositionIndicators count={imageCount} currentIndex={currentImageIndex} hidden={isZoomed} />
              
              <div className="absolute top-[calc(env(safe-area-inset-top,0px)+24px)] inset-x-4 z-[100] flex items-center justify-between pointer-events-none" style={{ opacity: isZoomed ? 0 : 1 }}>
                <button
                  data-no-cinematic
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onBack) onBack();
                  }}
                  className="pointer-events-auto flex items-center justify-center w-12 h-12 deck-hud-solid rounded-full text-white border border-white/20 active:scale-90 transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-7 h-7 -ml-0.5" strokeWidth={2.5} />
                </button>

                {canUndo ? (
                  <button
                    data-no-cinematic
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onUndo) onUndo();
                    }}
                    className="pointer-events-auto flex items-center justify-center w-12 h-12 deck-hud-solid rounded-full text-white border border-white/20 active:scale-90 transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                    aria-label="Undo"
                  >
                    <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                ) : <div className="w-12 h-12" />}
              </div>
            </>
          )}
        </div>



        {isTop && (
          <>
            <GestureHints hidden={isZoomed} />

        <motion.div className="absolute top-10 right-6 z-50 pointer-events-none rotate-[-12deg]" style={{ opacity: likeOpacity, scale: likeOpacity }}>
          <div className="flex flex-col items-center gap-1.5">
             <div className="px-5 py-2.5 rounded-2xl border-2 border-orange-500/80 bg-orange-500/20">
               <span className="font-black text-4xl text-white  tracking-tighter whitespace-nowrap">I LIKE IT</span>
             </div>
          </div>
        </motion.div>

        <motion.div className="absolute top-10 left-6 z-50 pointer-events-none rotate-[12deg]" style={{ opacity: passOpacity, scale: passOpacity }}>
          <div className="px-5 py-2.5 rounded-2xl border-2 border-rose-500/80 bg-rose-500/20">
            <span className="font-black text-4xl text-white  tracking-tighter">NOPE</span>
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
              <SwipeMatchMeter percentage={85} compact />
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

        {profile.verified && (
          <div className="absolute left-6 z-40 transition-opacity duration-150" style={{ top: 'calc(var(--safe-top, 0px) + var(--top-bar-height, 72px) + 12px)', opacity: isZoomed ? 0 : 1 }}>
             <div className="glass-pill px-3 py-1.5 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-violet-500" />
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
            className="absolute right-3 z-50 pointer-events-auto flex flex-col gap-2.5 items-center"
            style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 24px)' }}
          >
            {renderTopRail}

            <GlassIconButton
              icon={Map}
              onClick={() => useModalStore.getState().openPassportMap()}
              label="Map"
              tone="onPhoto"
              size="lg"
              guardSwipe
              className="w-[52px] h-[52px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
            />

            <div className="flex flex-col gap-2 p-1.5 rounded-full deck-hud-solid border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
              {[
                { icon: Crown, onClick: () => useModalStore.getState().setModal('showTokensModal', true), label: 'Tokens' },
                { icon: Mic, onClick: () => useModalStore.getState().openAIChat(), label: 'Voice' },
                { icon: Share2, onClick: onShare, label: 'Share' },
                { icon: MessageCircle, onClick: onMessage, label: 'Message' },
                { icon: BarChart3, onClick: onInsights, label: 'Insights' },
                { icon: Flag, onClick: onReport, label: 'Report' },
              ].map((btn, idx) => (
                <GlassIconButton
                  key={idx}
                  icon={btn.icon}
                  onClick={btn.onClick}
                  label={btn.label}
                  tone="surface"
                  size="md"
                  guardSwipe
                  className="w-[44px] h-[44px] bg-transparent border-none shadow-none text-white hover:bg-white/10"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
});

SimpleOwnerSwipeCardComponent.displayName = 'SimpleOwnerSwipeCard';
export const SimpleOwnerSwipeCard = memo(SimpleOwnerSwipeCardComponent);
