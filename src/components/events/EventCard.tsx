import { memo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ChevronUp, Calendar, MapPin, Bookmark, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { EventItem } from '@/types/events';
import { CATEGORIES } from '@/data/eventsData';
import { toast } from '@/components/ui/sonner';

const AUTOPLAY_DURATION = 6000;

function formatDate(str: string | null): string {
  if (!str) return '';
  const d = new Date(str);
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `In ${diff} days`;
}

function formatFullDate(str: string | null): string {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── STORY PROGRESS BAR ────────────────────────────────────────────────────────
const StoryProgressBar = memo(({ 
  duration, 
  isActive, 
  isPaused, 
  onComplete,
  animKey
}: { 
  duration: number; 
  isActive: boolean; 
  isPaused: boolean; 
  onComplete: () => void;
  animKey: number;
}) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  return (
    <div className="absolute top-[calc(env(safe-area-inset-top,0px)+8px)] left-4 right-4 z-[60] flex gap-1.5 h-1">
      <div className={cn(
        "relative flex-1 rounded-full overflow-hidden backdrop-blur-md",
        isLight ? "bg-black/10" : "bg-white/20"
      )}>
        <motion.div
          key={animKey}
          initial={{ width: '0%' }}
          animate={isActive ? { width: isPaused ? undefined : '100%' } : { width: '0%' }}
          transition={isActive && !isPaused ? { duration: duration / 1000, ease: 'linear' } : { duration: 0 }}
          onAnimationComplete={() => { if (isActive && !isPaused) onComplete(); }}
          className={cn(
            "absolute inset-y-0 left-0",
            isLight ? "bg-black/80 shadow-[0_0_8px_rgba(0,0,0,0.2)]" : "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          )}
        />
      </div>
    </div>
  );
});

// ── SINGLE EVENT CARD ─────────────────────────────────────────────────────────
export const EventCard = memo(({
  event, isActive, isPaused, animKey, onTickComplete, onLike, liked, onChat, onShare, onMiddleTap, _onNextEvent, _onPrevEvent,
  activeColor = '#f97316'
}: {
  event: EventItem; isActive: boolean; isPaused: boolean; animKey: number; onTickComplete: () => void; onLike: () => void; liked: boolean;
  onChat: () => void; onShare: () => void; onMiddleTap: () => void;
  _onNextEvent?: () => void; _onPrevEvent?: () => void;
  activeColor?: string;
}) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const [showDetails, setShowDetails] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastTapRef = useRef(0);

  const handleLike = useCallback(() => {
    onLike();
    if (!liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  }, [onLike, liked]);

  const handleSave = useCallback(() => {
    triggerHaptic('success');
    setSaved(prev => !prev);
    toast.success(saved ? 'Removed from saved' : 'Event saved!', { duration: 1500 });
  }, [saved]);

  const handleReport = useCallback(() => {
    triggerHaptic('medium');
    toast.success('Report submitted. Thank you!', { duration: 2000 });
  }, []);

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
  const hasImage = !!event.image_url;

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden transition-colors duration-500 touch-pan-y",
        isLight ? "bg-white" : "bg-black"
      )}
      data-testid={`event-card-${event.id}`}
    >
      {/* Story Progress Bar */}
      <StoryProgressBar 
        duration={AUTOPLAY_DURATION} 
        isActive={isActive && !showDetails} 
        isPaused={isPaused} 
        animKey={animKey}
        onComplete={onTickComplete}
      />
      
      {/* Background — event image or rich gradient */}
      {hasImage ? (
        <>
          <img
            src={event.image_url!}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {/* Darken for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
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
        {/* Save / Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
          className="flex flex-col items-center gap-1"
          title={saved ? "Unsave event" : "Save event"}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            animate={saved ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border transition-all",
              saved
                ? "bg-orange-500 border-orange-600 text-white shadow-orange-500/30"
                : "bg-black/40 border-white/15 text-white"
            )}
          >
            <Bookmark className={cn('w-5 h-5 transition-all', saved ? 'fill-white text-white' : 'text-white')} />
          </motion.div>
          <span className={cn("text-[10px] font-bold drop-shadow-lg", saved ? "text-orange-400" : "text-white/80")}>
            {saved ? 'Saved' : 'Save'}
          </span>
        </button>

        {/* Like / Heart */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); handleLike(); }}
          className="flex flex-col items-center gap-1"
          title={liked ? "Unlike" : "Like"}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border transition-all",
              liked ? "bg-red-500/25 border-red-500/50 shadow-red-500/20" : "bg-black/40 border-white/15"
            )}
          >
            <Heart className={cn('w-5 h-5 transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-white')} />
          </motion.div>
          <span className={cn("text-[10px] font-bold drop-shadow-lg", liked ? "text-red-400" : "text-white/80")}>Like</span>
        </button>

        {/* Chat / WhatsApp */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onChat(); }}
          className="flex flex-col items-center gap-1"
          title="Chat with host"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border bg-black/40 border-white/15"
          >
            <MessageCircle className="w-5 h-5 text-white" style={{ color: activeColor }} />
          </motion.div>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-lg">Chat</span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onShare(); }}
          className="flex flex-col items-center gap-1"
          title="Share event"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border bg-black/40 border-white/15"
          >
            <Share2 className="w-5 h-5 text-white" style={{ color: activeColor }} />
          </motion.div>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-lg">Share</span>
        </button>

        {/* Report */}
        <button
          onClick={(e) => { e.stopPropagation(); handleReport(); }}
          className="flex flex-col items-center gap-1"
          title="Report event"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border bg-black/40 border-white/15"
          >
            <Flag className="w-4 h-4 text-white/50" />
          </motion.div>
          <span className="text-[10px] font-bold text-white/40 drop-shadow-lg">Report</span>
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

        {/* Swipe hint */}
        <div className="flex items-center gap-2 mt-4 opacity-50">
          <div className="w-5 h-[2px] rounded-full bg-white/60" />
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">Swipe up for more</span>
        </div>
      </div>

      {/* ── DETAILS OVERLAY ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className={cn(
              "absolute inset-0 z-50 overflow-y-auto backdrop-blur-[20px]",
              isLight ? "bg-white/98" : "bg-black/96"
            )}
          >
            <div className="relative h-[45dvh]">
              {hasImage ? (
                <>
                  <img src={event.image_url!} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at 30% 50%, ${activeColor}44 0%, transparent 60%),
                                 linear-gradient(160deg, #0d0d10 0%, #111117 100%)`,
                  }}
                />
              )}
              <button 
                onClick={() => setShowDetails(false)} 
                className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-black/50 backdrop-blur-md border border-white/20"
                title="Close details"
              >
                <ChevronUp className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-6 left-5 right-5">
                <h3 className={cn("text-3xl font-black leading-tight", isLight ? "text-black" : "text-white")}>{event.title}</h3>
                {event.organizer_name && <p className={cn("text-sm mt-1", isLight ? "text-black/50" : "text-white/50")}>by {event.organizer_name}</p>}
              </div>
            </div>
            <div className="p-5 space-y-5">
              {event.description && <p className={cn("text-sm leading-relaxed", isLight ? "text-black/80" : "text-white/80")}>{event.description}</p>}
              <div className="grid grid-cols-2 gap-3">
                {event.event_date && (
                  <div className={cn("flex items-start gap-3 p-3 rounded-2xl", isLight ? "bg-black/5" : "bg-white/5")}>
                    <Calendar className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/70" : "text-white/70")}>Date</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{formatFullDate(event.event_date)}</div>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className={cn("flex items-start gap-3 p-3 rounded-2xl", isLight ? "bg-black/5" : "bg-white/5")}>
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/70" : "text-white/70")}>Location</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{event.location}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { handleSave(); }}
                  className={cn(
                    "py-4 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border transition-all shrink-0",
                    saved
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-500"
                      : isLight ? "text-black bg-black/5 border-black/10" : "text-white bg-white/10 border-white/15"
                  )}
                  title={saved ? "Unsave event" : "Save event"}
                >
                  <Bookmark className={cn("w-4 h-4", saved && "fill-orange-500")} />
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={() => onChat()}
                  className={cn("flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border", isLight ? "text-black bg-black/5 border-black/10" : "text-white bg-white/10 border-white/15")}
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" /> Chat
                </button>
                <button
                  onClick={() => onShare()}
                  className="flex-1 py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 bg-gradient-to-br from-orange-500 to-purple-600"
                  title="Share event"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
