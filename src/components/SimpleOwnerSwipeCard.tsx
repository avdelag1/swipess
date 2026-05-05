/**
 * TINDER-STYLE OWNER SWIPE CARD — Nexus Edition
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
import { motion, useMotionValue, useTransform, PanInfo, animate, useDragControls } from 'framer-motion';
import { MapPin, DollarSign, Briefcase, ThumbsUp, ThumbsDown, Flag, Share2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useMagnifier } from '@/hooks/useMagnifier';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { useUserRatingAggregateEnhanced } from '@/hooks/useRatingSystem';
import { getWorkScheduleLabel } from '@/constants/profileConstants';
import { SwipeMatchMeter } from '@/components/swipe/SwipeMatchMeter';
import useAppTheme from '@/hooks/useAppTheme';
import { imageCache } from '@/lib/swipe/cardImageCache';

export interface SimpleOwnerSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 65;
const VELOCITY_THRESHOLD = 280;
const MAX_ROTATION = 14;
const FALLBACK_PLACEHOLDER = '';

const getExitDistance = () => typeof window !== 'undefined' ? window.innerWidth * 1.5 : 800;

const SPRING_CONFIGS = {
  SILK: { stiffness: 500, damping: 25, mass: 0.4 },
};

const ACTIVE_SPRING = SPRING_CONFIGS.SILK;

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
  priority = false,
  fullScreen = false,
  animate: shouldAnimate = true
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
      <div className="absolute inset-0 bg-zinc-800" style={{ opacity: loaded ? 0 : 1, transition: 'opacity 150ms ease-out' }} />
      <img
        src={src}
        alt={alt}
        data-swipe-card-image="true"
        draggable={false}
        className={cn("absolute inset-0 w-full h-full object-cover", loaded ? "opacity-100" : "opacity-0")}
        style={{
          transition: 'opacity 150ms ease-out',
          animation: 'none',
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
  onTap?: () => void;
  onInsights?: () => void;
  onMessage?: () => void;
  isTop?: boolean;
  onDragStart?: () => void;
  onShare?: (profile: ClientProfile) => void;
  onReport?: () => void;
  onUndo?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  canUndo?: boolean;
  fullScreen?: boolean;
  externalX?: any;
}

const SimpleOwnerSwipeCardComponent = forwardRef<SimpleOwnerSwipeCardRef, SimpleOwnerSwipeCardProps>(({
  profile,
  onSwipe,
  onTap: _onTap,
  onInsights,
  isTop = true,
  onDragStart,
  externalX,
  onReport,
  onShare,
}, ref) => {
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const lastProfileIdRef = useRef(profile?.user_id || '');
  const dragControls = useDragControls();
  const dragStartedRef = useRef(false);
  const storedPointerEventRef = useRef<React.PointerEvent | null>(null);
  const { isLight } = useAppTheme();

  const _internalX = useMotionValue(0);
  const x = externalX ?? _internalX;
  const y = useMotionValue(0);

  const cardRotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const cardOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0.7, 1, 1, 1, 0.7]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);

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
      if ((dx > 28 || dy > 28) && !isMagnifierHoldPending()) {
        magnifierPointerHandlers.onPointerUp(e); 
        dragStartedRef.current = true;
        isDragging.current = true;
        dragControls.start((storedPointerEventRef.current as any).nativeEvent);
      }
    }
    magnifierPointerHandlers.onPointerMove(e);
  }, [isMagnifierActive, isMagnifierHoldPending, magnifierPointerHandlers, dragControls]);

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
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1);
      triggerHaptic('light');
    } else if (imageCount > 1 && clickX > width * 0.67) {
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1);
      triggerHaptic('light');
    } else if (onInsights) {
      triggerHaptic('light');
      onInsights();
    } else if (_onTap) {
      triggerHaptic('light');
      _onTap();
    }
  }, [imageCount, onInsights, isMagnifierActive, wasMagnifierActive, _onTap]);

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
    setTimeout(fireSwipe, 350);
  }, [onSwipe, x, y]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  if (!profile?.user_id) return null;

  if (!isTop) {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none', borderRadius: 28 }}>
        <div className="absolute inset-0">
          <CardImage src={currentImage} alt={profile.name || 'Client'} name={profile.name} fullScreen={true} />
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
        animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 } }}
        className="flex-1 cursor-grab active:cursor-grabbing select-none touch-none relative w-full h-full overflow-hidden border-none gpu-ultra"
        style={{
          x, y, rotate: cardRotate, opacity: cardOpacity, willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden',
          borderRadius: 28,
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
            <video src={videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <CardImage src={currentImage} alt={profile.name || 'Client'} name={profile.name} priority={isTop} fullScreen={true} animate={!isZoomed} />
          )}

          <div className="absolute top-0 left-0 right-0 pointer-events-none z-20"
               style={{ height: '38%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 25%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.12) 80%, transparent 100%)', opacity: isZoomed ? 0 : 1 }} />
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
               style={{ height: '58%', background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 18%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.22) 65%, rgba(0,0,0,0.06) 85%, transparent 100%)', opacity: isZoomed ? 0 : 1 }} />

          {imageCount > 1 && (
            <div className="absolute top-[calc(var(--safe-top,0px)+72px)] inset-x-0 flex justify-center z-20 pointer-events-none" style={{ opacity: isZoomed ? 0 : 1 }}>
              <div className="flex gap-1 w-full max-w-[110px] px-2">
                {images.map((_, idx) => (
                  <div key={idx} className="h-[2.5px] flex-1 rounded-full overflow-hidden bg-white/25">
                    <motion.div animate={{ x: idx < currentImageIndex ? '0%' : idx === currentImageIndex ? '0%' : '-100%', opacity: idx === currentImageIndex ? 1 : 0.5 }}
                               className="w-full h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <motion.div className="absolute top-10 right-6 z-50 pointer-events-none" style={{ opacity: likeOpacity }}>
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-orange-500/20 border-2 border-orange-500 shadow-[0_0_20px_rgba(255,87,34,0.5)]" style={{ transform: 'rotate(15deg)' }}>
            <ThumbsUp className="w-9 h-9 text-orange-500" fill="currentColor" strokeWidth={0} />
          </div>
        </motion.div>

        <motion.div className="absolute top-10 left-6 z-50 pointer-events-none" style={{ opacity: passOpacity }}>
          <div className="px-5 py-2.5 rounded-xl border-3 border-rose-500 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.5)]" style={{ transform: 'rotate(-15deg)' }}>
            <span className="font-black text-4xl text-rose-500">NOPE</span>
          </div>
        </motion.div>

        <div className="absolute left-5 right-5 bottom-[calc(var(--bottom-nav-height,72px)+100px)] z-30 pointer-events-none" style={{ opacity: isZoomed ? 0 : 1 }}>
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
          <div className="absolute top-16 left-6 z-40" style={{ opacity: isZoomed ? 0 : 1 }}>
             <div className="px-3 py-1.5 rounded-full flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10">
               <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">Verified</span>
             </div>
          </div>
        )}

        {isTop && (onReport || onShare) && (
          <div
            className="absolute right-5 bottom-[calc(var(--bottom-nav-height,72px)+100px)] z-40 flex flex-col items-end gap-2 transition-opacity duration-150"
            style={{ opacity: isZoomed ? 0 : 1 }}
          >
            {onShare && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onShare(profile); }}
                aria-label="Share profile"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/55 backdrop-blur-md border border-white/15 active:scale-95 transition-all duration-150 hover:bg-black/70 shadow-lg"
              >
                <Share2 className="w-4 h-4 text-white" strokeWidth={2.2} />
              </button>
            )}
            {onReport && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onReport(); }}
                aria-label="Report profile"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/55 backdrop-blur-md border border-white/15 active:scale-95 transition-all duration-150 hover:bg-black/70 shadow-lg"
              >
                <Flag className="w-4 h-4 text-white" strokeWidth={2.2} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
});

SimpleOwnerSwipeCardComponent.displayName = 'SimpleOwnerSwipeCard';
export const SimpleOwnerSwipeCard = memo(SimpleOwnerSwipeCardComponent);
