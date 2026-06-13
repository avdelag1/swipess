import { memo, useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Flag, Heart, MapPin, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { EventItem } from '@/types/events';
import { CATEGORIES } from '@/data/eventsData';

function formatDate(str: string | null): string {
  if (!str) return '';
  const d = new Date(str);
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `In ${diff} days`;
}

// ── SINGLE EVENT CARD ─────────────────────────────────────────────────────────
export const EventCard = memo(({
  event, onLike, liked, onChat, onShare, onMiddleTap,
  activeColor = '#f97316',
  imageUrl
}: {
  event: EventItem; onLike: () => void; liked: boolean;
  onChat: () => void; onShare: () => void; onMiddleTap: () => void;
  activeColor?: string;
  imageUrl?: string | null;
}) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const [likeAnim, setLikeAnim] = useState(false);
  const lastTapRef = useRef(0);

  const handleLike = useCallback(() => {
    onLike();
    if (!liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  }, [onLike, liked]);

  const handleReport = useCallback(() => {
    triggerHaptic('medium');
    (window as any).dispatchEvent(new CustomEvent('open-report', { detail: { reportedListingId: event.id, reportedListingTitle: event.title, category: 'listing' } }));
  }, [event.id, event.title]);

  // Double-tap to like
  const handleCardTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      // Double tap → like
      handleLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap → open detail after a short delay
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          onMiddleTap();
          lastTapRef.current = 0;
        }
      }, 360);
    }
  }, [handleLike, onMiddleTap]);

  const categoryMeta = CATEGORIES.find(c => c.key === event.category);
  const finalImageUrl = imageUrl || event.image_url;
  const hasImage = !!finalImageUrl;

  return (
    <div
      className={cn(
        "force-white relative w-full h-full overflow-hidden transition-colors duration-500 touch-pan-y",
        isLight ? "bg-white" : "bg-black"
      )}
      data-testid={`event-card-${event.id}`}
    >
      {/* Background — event image or rich gradient */}
      {hasImage ? (
        <>
          <img
            src={finalImageUrl!}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {/* Darken for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </>
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

      {/* Gradient overlay for bottom text */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        hasImage 
          ? "bg-gradient-to-t from-black/95 via-transparent to-transparent"
          : isLight 
            ? "bg-gradient-to-t from-white/80 via-white/10 to-white/20 opacity-90" 
            : "bg-gradient-to-t from-black/80 via-black/5 to-black/20"
      )} />

      {/* Tap anywhere on card body to open detail */}
      <button
        onClick={handleCardTap}
        className="absolute inset-0 z-[5] w-full h-full cursor-pointer"
        aria-label="Open event details"
      />

      {/* Double-tap to like overlay */}
      <AnimatePresence>
        {likeAnim && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" style={{ color: activeColor, fill: activeColor }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RIGHT SIDE ACTION RAIL ──────────────────────────────────────── */}
      <div className="absolute right-3 flex flex-col gap-4 items-center z-30 bottom-[calc(11rem+env(safe-area-inset-bottom,0px))]">
        {/* Like / Heart */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); handleLike(); }}
          className="flex flex-col items-center gap-1 outline-none focus:outline-none focus-visible:outline-none"
          title={liked ? "Unlike" : "Like"}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border transition-all",
              liked ? "bg-red-500/25 border-red-500/50 shadow-red-500/20" : "bg-white/10 border-white/20"
            )}>
            <Heart className={cn('w-5 h-5 transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-white')} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", liked ? "text-red-400" : "text-white/60")}>Like</span>
        </button>

        {/* Chat / WhatsApp */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onChat(); }}
          className="flex flex-col items-center gap-1 outline-none focus:outline-none focus-visible:outline-none"
          title="Chat with host"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border bg-white/10 border-white/20"
          >
            <MessageCircle className="w-5 h-5 text-white" style={{ color: activeColor }} />
          </motion.div>
          <span className={cn("text-[10px] font-bold text-white/60")}>Chat</span>
        </button>

        {/* Share */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onShare(); }}
          className="flex flex-col items-center gap-1 outline-none focus:outline-none focus-visible:outline-none"
          title="Share event"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border bg-white/10 border-white/20"
          >
            <Share2 className="w-5 h-5 text-white" style={{ color: activeColor }} />
          </motion.div>
          <span className={cn("text-[10px] font-bold text-white/60")}>Share</span>
        </button>

        {/* Report */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); handleReport(); }}
          className="flex flex-col items-center gap-1 outline-none focus:outline-none focus-visible:outline-none"
          title="Report event"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border bg-white/10 border-white/20"
          >
            <Flag className="w-4 h-4 text-white/50" />
          </motion.div>
          <span className={cn("text-[10px] font-bold text-white/60")}>Report</span>
        </button>
      </div>

      {/* ── BOTTOM INFO PANEL ──────────────────────────────────────────── */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-6 pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        {/* Category pill */}
        {categoryMeta && (
          <div className="flex items-center gap-2 mb-3 pointer-events-auto">
            <div 
              className="px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/10"
              style={{ background: `${activeColor}30` }}
            >
              {categoryMeta.icon && <categoryMeta.icon className="w-3 h-3" style={{ color: activeColor }} />}
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white">{categoryMeta.label}</span>
            </div>

            {event.is_free && (
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">Free</span>
              </div>
            )}

            {event.discount_tag && (
              <div className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-yellow-400">{event.discount_tag}</span>
              </div>
            )}
          </div>
        )}

        {/* Event title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-2xl pr-16">
          {event.title}
        </h2>

        {/* Organizer */}
        {event.organizer_name && (
          <p className="text-sm text-white/60 font-semibold mt-1.5 drop-shadow-lg">
            by {event.organizer_name}
          </p>
        )}

        {/* Promo text */}
        {event.promo_text && (
          <p className="text-sm text-white/80 mt-2 leading-relaxed drop-shadow-lg line-clamp-2 pr-16">
            {event.promo_text}
          </p>
        )}

        {/* Meta chips: date + location */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {event.event_date && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-bold text-white/90">{formatDate(event.event_date)}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-bold text-white/90 truncate max-w-[140px]">{event.location}</span>
            </div>
          )}
          {event.price_text && !event.is_free && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-bold text-white/90">{event.price_text}</span>
            </div>
          )}
        </div>

        {/* Interaction hint — single tap opens the full event detail page */}
        <div className="flex items-center gap-2 mt-4 opacity-50">
          <div className="w-5 h-[2px] rounded-full bg-white/60" />
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">Tap for details</span>
        </div>
      </div>
    </div>
  );
});
