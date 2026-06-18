import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { animate, AnimatePresence, motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Calendar, ChevronLeft, Eye, Flag, Heart, MapPin, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { revealChrome, useChromeReveal } from '@/hooks/useChromeReveal';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { EXIT_SPRING, SNAP_BACK_SPRING } from '@/components/swipe/SwipeConstants';
import { CATEGORIES } from '@/data/eventsData';
import type { EventItem } from '@/types/events';
import CardImage from '@/components/CardImage';

export interface EventSwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;

function formatDate(str: string | null): string {
  if (!str) return '';
  const d = new Date(str);
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `In ${diff} days`;
}

interface EventSwipeCardProps {
  event: EventItem;
  liked?: boolean;
  isTop?: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onLike: () => void;
  onChat: () => void;
  onShare: () => void;
  onReport: () => void;
  onDetails: () => void;
  onExit?: () => void;
  onDragStart?: () => void;
}

const EventSwipeCardComponent = forwardRef<EventSwipeCardRef, EventSwipeCardProps>(({
  event,
  liked = false,
  isTop = true,
  onSwipe,
  onLike,
  onChat,
  onShare,
  onReport,
  onDetails,
  onExit,
  onDragStart,
}, ref) => {
  const { isRailVisible } = useChromeReveal();
  const isDragging = useRef(false);
  const hasExited = useRef(false);
  const isExitingRef = useRef(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.5, 0]);
  const rotate = useTransform(x, [-800, 800], [-25, 25]);
  const scale = useTransform(x, [-800, 0, 800], [0.95, 1, 0.95]);

  const categoryMeta = CATEGORIES.find((c) => c.key === event.category);
  const activeColor = categoryMeta?.color ?? '#ec4899';
  const imageUrl = event.image_url;

  useEffect(() => {
    if (isTop) {
      hasExited.current = false;
      isExitingRef.current = false;
      revealChrome();
    }
  }, [isTop, event.id]);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    triggerHaptic('light');
    onDragStart?.();
  }, [onDragStart]);

  const fireExit = useCallback((direction: 'left' | 'right', velocityX = 0) => {
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
    animate(x, exitX, { ...EXIT_SPRING, velocity: velocityX, onComplete: fireSwipe });
    setTimeout(fireSwipe, 800);
  }, [onSwipe, x, y]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (hasExited.current) return;
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const horizCommit = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD;
    if (horizCommit) {
      fireExit(dx > 0 ? 'right' : 'left', vx);
    } else {
      animate(x, 0, { ...SNAP_BACK_SPRING, velocity: vx });
      animate(y, 0, SNAP_BACK_SPRING);
    }
    isDragging.current = false;
  }, [fireExit, x, y]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    if (hasExited.current) return;
    fireExit(direction);
  }, [fireExit]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: handleButtonSwipe,
  }), [handleButtonSwipe]);

  const handleImageTap = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const height = rect.height;
    revealChrome();
    triggerHaptic('light');
    if (clickY > height * 0.33 && clickY < height * 0.67) {
      onDetails();
    }
  }, [onDetails]);

  const handleLike = useCallback(() => {
    onLike();
    if (!liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  }, [onLike, liked]);

  return (
    <div className={cn('absolute inset-0 flex flex-col', isTop ? 'pointer-events-auto' : 'pointer-events-none')}>
      <motion.div
        drag={isTop ? 'x' : false}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 350, bounceDamping: 32 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          'swipe-live-card flex-1 select-none touch-none relative w-full h-full overflow-hidden border-none gpu-ultra',
          isTop ? 'cursor-grab active:cursor-grabbing' : '',
        )}
        style={{
          x,
          y,
          rotate: isTop ? rotate : 0,
          scale: isTop ? scale : 0.95,
          opacity: isTop ? 1 : 0.6,
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)',
          transformOrigin: '50% 120%',
          backfaceVisibility: 'hidden',
          borderRadius: 48,
          boxShadow: isTop
            ? '0 25px 50px -12px rgba(0,0,0,0.45), 0 10px 30px -5px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 4px 10px rgba(0,0,0,0.1)',
          background: 'hsl(var(--swipe-deck-frame))',
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 'inherit', touchAction: 'none' }}
          onClick={handleImageTap}
        >
          {imageUrl ? (
            <CardImage
              src={imageUrl}
              alt={event.title}
              name={event.title}
              priority={isTop}
              fullScreen
              animate={isTop}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 30% 40%, ${activeColor}55 0%, transparent 55%),
                             radial-gradient(ellipse at 80% 70%, ${activeColor}33 0%, transparent 50%),
                             linear-gradient(160deg, #0d0d10 0%, #111117 50%, #0a0a0d 100%)`,
              }}
            />
          )}

          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: '42%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 80%, transparent 100%)',
            }}
          />
        </div>

        {isTop && (
          <div
            className="absolute top-[calc(env(safe-area-inset-top,0px)+24px)] inset-x-4 z-[100] flex items-center justify-between pointer-events-none"
          >
            <button
              data-no-cinematic
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onExit?.();
              }}
              className="pointer-events-auto flex items-center justify-center w-12 h-12 deck-hud-solid rounded-full text-white border border-white/20 active:scale-90 transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
              aria-label="Back"
            >
              <ChevronLeft className="w-7 h-7 -ml-0.5" strokeWidth={2.5} />
            </button>
            <div className="w-12 h-12" />
          </div>
        )}

        <motion.div className="absolute top-10 right-6 z-50 pointer-events-none rotate-[-12deg]" style={{ opacity: likeOpacity }}>
          <div className="px-5 py-2.5 rounded-xl border-3 border-pink-500 bg-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            <span className="font-black text-3xl text-pink-400 tracking-tighter whitespace-nowrap">GOING!</span>
          </div>
        </motion.div>

        <motion.div className="absolute top-10 left-6 z-50 pointer-events-none rotate-[12deg]" style={{ opacity: passOpacity }}>
          <div className="px-5 py-2.5 rounded-xl border-3 border-rose-500 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
            <span className="font-black text-3xl text-rose-500">SKIP</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {likeAnim && (
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <Heart className="w-24 h-24 fill-pink-500 text-pink-500 drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="absolute left-5 right-5 z-30 pointer-events-none"
          style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 16px)' }}
        >
          <div className="space-y-2">
            {categoryMeta && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white border border-white/10"
                  style={{ background: `${activeColor}40` }}
                >
                  {categoryMeta.label}
                </span>
                {event.is_free && (
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30">
                    Free
                  </span>
                )}
                {event.discount_tag && (
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-yellow-300 bg-yellow-500/20 border border-yellow-500/30">
                    {event.discount_tag}
                  </span>
                )}
              </div>
            )}

            <div
              className="inline-flex flex-col w-fit max-w-full px-4 py-3 rounded-3xl"
              style={{
                background: 'rgba(20, 20, 24, 0.55)',
                boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.55)',
                color: '#FFFFFF',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
              }}
            >
              <h3 className="text-lg font-black leading-tight">{event.title}</h3>
              {event.organizer_name && (
                <p className="text-xs text-white/60 font-semibold mt-0.5">by {event.organizer_name}</p>
              )}
              {event.promo_text && (
                <p className="text-xs text-white/75 mt-1 line-clamp-2">{event.promo_text}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {event.event_date && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/80">
                    <Calendar className="w-3 h-3" style={{ color: activeColor }} />
                    {formatDate(event.event_date)}
                  </span>
                )}
                {event.location && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/80">
                    <MapPin className="w-3 h-3" style={{ color: activeColor }} />
                    <span className="truncate max-w-[140px]">{event.location}</span>
                  </span>
                )}
                {event.price_text && !event.is_free && (
                  <span className="text-[10px] font-bold text-white/80">{event.price_text}</span>
                )}
              </div>
            </div>

            {!isRailVisible && (
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mt-2">
                Tap photo to reveal actions
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isTop && isRailVisible && (
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
            <GlassIconButton
              icon={Heart}
              onClick={handleLike}
              label={liked ? 'Unlike' : 'Like'}
              tone="onPhoto"
              size="lg"
              guardSwipe
              iconColor={liked ? '#f43f5e' : undefined}
              iconClassName={liked ? 'fill-rose-500' : undefined}
              className={cn(
                'w-[52px] h-[52px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
                liked && 'border-rose-500/50',
              )}
            />

            <div className="flex flex-col gap-2 p-1.5 rounded-full deck-hud-solid border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
              {[
                { icon: Eye, onClick: onDetails, label: 'Details' },
                { icon: MessageCircle, onClick: onChat, label: 'WhatsApp' },
                { icon: Share2, onClick: onShare, label: 'Share' },
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

EventSwipeCardComponent.displayName = 'EventSwipeCard';
export const EventSwipeCard = memo(EventSwipeCardComponent);