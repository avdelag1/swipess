/**
 * TINDER-STYLE OWNER SWIPE CARD â€” Swipes Edition
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
import { animate, AnimatePresence, motion, MotionValue, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { BarChart3, Briefcase, DollarSign, Flag, MapPin, MessageCircle, Share2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useMagnifier } from '@/hooks/useMagnifier';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { LoopVideo } from '@/components/video/LoopVideo';
import { useUserRatingAggregateEnhanced } from '@/hooks/useRatingSystem';
import { getWorkScheduleLabel } from '@/constants/profileConstants';
import { SwipeMatchMeter } from '@/components/swipe/SwipeMatchMeter';
import useAppTheme from '@/hooks/useAppTheme';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { PhotoPositionIndicators } from '@/components/swipe/PhotoPositionIndicators';
import { GestureHints } from '@/components/swipe/GestureHints';
import { revealChrome } from '@/hooks/useChromeReveal';
import { EXIT_SPRING, SNAP_BACK_SPRING } from '@/components/swipe/SwipeConstants';

export interface SimpleOwnerSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 30;
const VELOCITY_THRESHOLD = 120;
const SKIP_THRESHOLD = 70;
const SKIP_VELOCITY = 250;
const FALLBACK_PLACEHOLDER = '';
type DragAxis = 'x' | 'y' | null;

const _getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;

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

const PlaceholderImage = memo(({ name }: { name?: string | null }) => (
  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-900">
    <div className="mb-6 flex flex-col items-center">
      <h1 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] uppercase">SWIPESS</h1>
      <div className="h-1 w-12 bg-white/40 mt-2 rounded-full" />
    </div>
    <h3 className="text-white text-2xl font-black tracking-tight mb-2 uppercase">{name || 'Client'}</h3>
    <p className="text-white/70 text-sm font-bold uppercase tracking-wider leading-relaxed">No photos available</p>
  </div>
));

const CardImage = memo(({ 
  src, 
  alt, 
  name, 
  _priority = false,
  _fullScreen = false,
  animate: _shouldAnimate = true
}: { 
  src: string; 
  alt: string; 
  name?: string | null;
  priority?: boolean;
  fullScreen?: boolean;
  animate?: boolean;
}) => {
  const [loaded, setLoaded] = useState(() => imageCache.has(src));
  const [error, setError] = useState(false);
  const isPlaceholder = !src || src === FALLBACK_PLACEHOLDER || error;

  useEffect(() => {
    if (!src || error || isPlaceholder || imageCache.has(src)) return;
    const img = new Image();
    img.onload = () => { imageCache.set(src, true); setLoaded(true); };
    img.onerror = () => setError(true);
    img.src = src;
  }, [src, error, isPlaceholder]);

  if (isPlaceholder) return <PlaceholderImage name={name} />;

  return (
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 1, overflow: 'hidden', borderRadius: 28 }}>
      {/* Shimmer loading background always behind the image */}
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
            zIndex: 1,
          }}
        >
          <motion.div 
            className="absolute inset-x-[-100%] inset-y-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* The actual image renders unconditionally to prevent unmount blinking */}
      <img
        src={src}
        alt={alt}
        data-swipe-card-image="true"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{
          opacity: loaded ? 1 : 0,
          zIndex: 2,
          borderRadius: 28,
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        onDragStart={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
        onLoad={() => { imageCache.set(src, true); setLoaded(true); }}
        onError={() => setError(true)}
      />
    </div>
  );
});

interface SimpleOwnerSwipeCardProps {
  profile: ClientProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onSkip?: () => void;
  onSkipBack?: () => void;
  onTap?: () => void;
  onInsights?: () => void;
  onSoon?: () => void;
  onMessage?: () => void;
  isTop?: boolean;
  onDragStart?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onUndo?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  canUndo?: boolean;
  fullScreen?: boolean;
  externalX?: MotionValue<number>;
  externalY?: MotionValue<number>;
  disableDrag?: boolean;
  canGoBack?: boolean;
}

const SimpleOwnerSwipeCardComponent = forwardRef<SimpleOwnerSwipeCardRef, SimpleOwnerSwipeCardProps>(({
  profile,
  onSwipe,
  onSkip,
  onSkipBack,
  onTap: onTap,
  onInsights,
  isTop = true,
  onDragStart,
  externalX,
  externalY,
  onReport,
  onShare,
  onMessage,
  onSoon,
  disableDrag,
  fullScreen = false,
  canGoBack = true,
}, ref) => {
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastProfileIdRef = useRef(profile?.user_id || '');
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);
  const dragAxisRef = useRef<DragAxis>(null);
  const { isLight } = useAppTheme();
  const _internalX = useMotionValue(0);
  const _internalY = useMotionValue(0);
  const x = externalX ?? _internalX;
  const y = externalY ?? _internalY;

  const cardOpacity = useTransform([x, y] as any, () => 1);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);
  const skipOpacity = useTransform(y as MotionValue<number>, (v: number) => Math.min(1, Math.abs(v) / SKIP_THRESHOLD));

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = useMemo(() => {
    if (!profile) return [FALLBACK_PLACEHOLDER];
    return Array.isArray(profile.profile_images) && profile.profile_images.length > 0
      ? profile.profile_images
      : [FALLBACK_PLACEHOLDER];
  }, [profile]);

  const imageCount = images.length;
  const currentImage = images[currentImageIndex] || FALLBACK_PLACEHOLDER;
  const videoUrl = (profile as any)?.video_url as string | null | undefined;
  const showVideoSlide = !!videoUrl && currentImageIndex === 0;

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

  const [isZoomed, setIsZoomed] = useState(false);
  const _floatingIconFilter = isLight
    ? 'drop-shadow(0 1px 1px hsl(var(--background) / 0.95)) drop-shadow(0 2px 6px hsl(var(--foreground) / 0.42))'
    : 'drop-shadow(0 2px 7px hsl(var(--background) / 0.9))';
  const { containerRef, pointerHandlers: magnifierPointerHandlers, isActive: isMagnifierActive, wasActive: wasMagnifierActive, isHoldPending: isMagnifierHoldPending } = useMagnifier({
    scale: 2.8,
    holdDelay: 380,
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
      if ((dx > 4 || dy > 4) && !isMagnifierHoldPending()) {
        magnifierPointerHandlers.onPointerUp(e);
        dragStartedRef.current = true;
        isDragging.current = true;
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
    if (hasExited.current) return;
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
      y.set(0);
      animate(x, exitX, { ...EXIT_SPRING, velocity: info.velocity.x });
      onSwipe(direction);
    } else if (vertCommit && (onSkip || onSkipBack)) {
      const dir = dy > 0 ? 1 : -1;
      if (dir > 0 && !canGoBack) {
        triggerHaptic('light');
        animate(x, 0, { ...SNAP_BACK_SPRING });
        animate(y, 100, { ...SNAP_BACK_SPRING, onComplete: () => animate(y, 0, { ...SNAP_BACK_SPRING }) });
      } else {
        hasExited.current = true;
        triggerHaptic('light');
        animate(x, 0, { ...SNAP_BACK_SPRING });
        if (dir < 0) onSkip?.();
        else onSkipBack?.();
      }
    } else {
      animate(x, 0, { ...SNAP_BACK_SPRING, velocity: info.velocity.x });
      animate(y, 0, { ...SNAP_BACK_SPRING, velocity: info.velocity.y });
    }
    setTimeout(() => { isDragging.current = false; dragAxisRef.current = null; }, 100);
  }, [onSwipe, onSkip, onSkipBack, canGoBack, x, y]);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    if (isMagnifierActive() || wasMagnifierActive()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (imageCount > 1 && clickX < width * 0.33) {
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
      triggerHaptic('light');
    } else if (imageCount > 1 && clickX > width * 0.67) {
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
      triggerHaptic('light');
    } else {
      revealChrome();
      onTap?.();
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
    animate(y, 0, { ...SNAP_BACK_SPRING });
    animate(x, exitX, { ...EXIT_SPRING });
    onSwipe(direction);
  }, [onSwipe, x, y]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  if (!profile?.user_id) return null;



  return (
    <div className={cn("absolute inset-0 flex flex-col", isTop ? "pointer-events-auto" : "pointer-events-none")}>
      <motion.div
        drag={disableDrag ? false : (isTop ? true : false)}
        dragListener={disableDrag ? false : (isTop ? true : undefined)}
        dragDirectionLock={disableDrag ? false : (isTop ? true : undefined)}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 800, bounceDamping: 25 }} // Instantly glues to finger
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDirectionLock={handleDirectionLock}
        onDragEnd={handleDragEnd}
        onPointerDown={handleUnifiedPointerDown}
        onPointerMove={handleUnifiedPointerMove}
        onPointerUp={handleUnifiedPointerUp}
        onPointerCancel={handleUnifiedPointerUp}
        initial={{ scale: 0.97, opacity: 0.85 }}
        animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 600, damping: 28, mass: 0.3 } }}
        className={cn("flex-1 select-none touch-none relative w-full h-full overflow-hidden border-none gpu-ultra", isTop && !disableDrag ? "cursor-grab active:cursor-grabbing" : "")}
        style={{
          x, y, opacity: cardOpacity, willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden',
          borderRadius: fullScreen ? 0 : 28,
          boxShadow: 'none',
          background: 'hsl(var(--background))',
        }}
      >
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 'inherit', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
          onClick={handleImageTap}
          onDragStart={(event) => event.preventDefault()}
          onContextMenu={(event) => event.preventDefault()}
        >
          {showVideoSlide ? (
            <LoopVideo src={videoUrl!} className="absolute inset-0 w-full h-full object-cover" active={isTop} />
          ) : (
            <CardImage src={currentImage} alt={profile.name || 'Client'} name={profile.name} priority fullScreen={true} animate={!isZoomed} />
          )}
          {isTop && (
            <>
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
                  style={{ height: '42%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 80%, transparent 100%)', opacity: isZoomed ? 0 : 1 }} />
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
          <div className="px-5 py-2.5 rounded-xl border-3 border-rose-500 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
            <span className="font-black text-4xl text-rose-500">NOPE</span>
          </div>
        </motion.div>

        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none" style={{ opacity: skipOpacity }}>
          <div className="px-4 py-2 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
            <span className="text-white text-sm font-bold tracking-widest uppercase">Next</span>
          </div>
        </motion.div>

        <div className="absolute left-5 right-5 bottom-[calc(var(--bottom-nav-height,72px)+16px)] z-30 pointer-events-none" style={{ opacity: isZoomed ? 0 : 1 }}>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex rounded-full px-3 py-1 bg-black/80 border border-white/10">
                <CompactRatingDisplay aggregate={ratingAggregate as any} isLoading={isRatingLoading} showReviews={false} className="text-white" />
              </div>
              <SwipeMatchMeter percentage={85} compact />
            </div>
            
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">
              {profile.name || 'Anonymous'}{profile.age ? `, ${profile.age}` : ''}
            </h2>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
              {profile.city && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest">{profile.city}</span>
                </div>
              )}
              {profile.budget_max && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Up to ${profile.budget_max.toLocaleString()}</span>
                </div>
              )}
              {profile.work_schedule && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest">{getWorkScheduleLabel(profile.work_schedule)}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
             style={{ height: '42%', background: isLight ? 'linear-gradient(to top, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 35%, transparent 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.32) 35%, transparent 100%)', opacity: isZoomed ? 0 : 1 }} />

        {profile.verified && (
          <div className="absolute top-16 left-6 z-40 flex gap-2" style={{ opacity: isZoomed ? 0 : 1 }}>
             <div className="px-3 py-1.5 rounded-full flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10">
               <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">Verified</span>
             </div>
             
             <div className="px-3 py-1.5 rounded-full flex items-center gap-2 bg-primary/20 backdrop-blur-md border border-primary/20 animate-pulse-slow">
               <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,77,0,1)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Pulse</span>
             </div>
          </div>
        )}

          </>
        )}
      </motion.div>

      <AnimatePresence>
        {isTop && !isZoomed && (
          <motion.div
            initial={{ opacity: 0, x: -18, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -12, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-3 top-[calc(var(--safe-top,0px)+var(--top-bar-height,56px)+60px)] z-50 pointer-events-auto"
          >
            <div
              className="flex flex-row gap-1.5 p-1.5 rounded-full"
              style={{
                background: 'rgba(20, 20, 24, 0.42)',
                backdropFilter: 'blur(24px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 10px 30px -8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              {[
                { icon: Share2, onClick: onShare, label: 'Share' },
                { icon: MessageCircle, onClick: onMessage, label: 'Message' },
                { icon: BarChart3, onClick: onInsights, label: 'Insights' },
                { icon: Flag, onClick: onReport, label: 'Report' },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    btn.onClick?.();
                  }}
                  aria-label={btn.label}
                  className="w-9 h-9 rounded-full flex items-center justify-center border-none p-0 outline-none active:scale-[0.88] transition-transform"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <btn.icon
                    color="#FFFFFF"
                    className="w-[18px] h-[18px]"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}
                    strokeWidth={1.8}
                  />
                </button>
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
