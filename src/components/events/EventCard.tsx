import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, ChevronUp, Calendar, MapPin, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';
import CardImage from '@/components/CardImage';
import { EventItem } from '@/types/events';

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
  const { theme } = useTheme();
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
  event, isActive, isPaused, animKey, onTickComplete, onLike, liked, onChat, onShare, onMiddleTap, onNextEvent, onPrevEvent,
  activeColor = '#f97316'
}: {
  event: EventItem; isActive: boolean; isPaused: boolean; animKey: number; onTickComplete: () => void; onLike: () => void; liked: boolean;
  onChat: () => void; onShare: () => void; onMiddleTap: () => void;
  onNextEvent: () => void; onPrevEvent: () => void;
  activeColor?: string;
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showDetails, setShowDetails] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = () => {
    onLike();
    if (!liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  };

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
      
      {/* Background photo with breathing-zoom */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{
            scale: [1, 1.06, 1], 
            opacity: 1,
          }}
          transition={{
            scale: { duration: 12, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.6 },
          }}
          className="w-full h-full transform-gpu"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        >
          <CardImage
            src={event.image_url}
            alt={event.title}
            fullScreen
            animate={true}
            priority={isActive} // 🚀 SPEED BOOST: Only the active card gets high priority loading
          />
        </motion.div>
      </div>

      {/* Gradient overlays */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-700",
        isLight 
          ? "bg-gradient-to-t from-white/80 via-white/10 to-white/20 opacity-90" 
          : "bg-gradient-to-t from-black/80 via-black/5 to-black/20"
      )} />

      {/* Compact navigation affordances — small explicit controls that do not block vertical swipe */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center px-3">
        <button
          onClick={(e) => { e.stopPropagation(); onPrevEvent(); }}
          className={cn(
            "pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center transition-opacity shadow-lg backdrop-blur-[10px] border opacity-75 hover:opacity-100 active:scale-95",
            isLight ? "bg-white/55 border-black/10" : "bg-black/28 border-white/12"
          )}
          title="Previous event"
        >
          <ChevronLeft className={cn("w-4 h-4", isLight ? "text-black" : "text-white")} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center px-3">
        <button
          onClick={(e) => { e.stopPropagation(); onNextEvent(); }}
          className={cn(
            "pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center transition-opacity shadow-lg backdrop-blur-[10px] border opacity-75 hover:opacity-100 active:scale-95",
            isLight ? "bg-white/55 border-black/10" : "bg-black/28 border-white/12"
          )}
          title="Next event"
        >
          <ChevronRight className={cn("w-4 h-4", isLight ? "text-black" : "text-white")} />
        </button>
      </div>

      {/* Tap anywhere on card body to open detail */}
      <button
        onClick={(e) => { e.stopPropagation(); onMiddleTap(); }}
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

      {/* Right side action buttons */}
      <div className="absolute right-4 flex flex-col gap-5 items-center z-30 bottom-[calc(9rem+env(safe-area-inset-bottom,0px))]">
        {/* Save / Bookmark button — liking an event saves it */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); handleLike(); }}
          className="flex flex-col items-center gap-1"
          title={liked ? "Saved — tap to unsave" : "Save event"}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            animate={liked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border transition-all",
              liked
                ? "bg-orange-500/25 border-orange-500/60 shadow-orange-500/20"
                : isLight ? "bg-white/70 border-black/10" : "bg-black/40 border-white/15"
            )}
          >
            <Bookmark className={cn('w-6 h-6 transition-all', liked ? 'fill-orange-400 text-orange-400' : (isLight ? 'text-black' : 'text-white'))} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", liked ? "text-orange-400" : isLight ? "text-black/60" : "text-white/60")}>
            {liked ? 'Saved' : 'Save'}
          </span>
        </button>

        {/* Like / Heart button */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); handleLike(); }}
          className="flex flex-col items-center gap-1"
          title={liked ? "Unlike" : "Like"}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border transition-all",
              liked ? "bg-red-500/20 border-red-500/40" : (isLight ? "bg-white/70 border-black/10" : "bg-black/40 border-white/15")
            )}
          >
            <Heart className={cn('w-6 h-6 transition-colors', liked ? 'fill-red-500 text-red-500' : (isLight ? 'text-black' : 'text-white'))} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", liked ? "text-red-400" : isLight ? "text-black/60" : "text-white/60")}>Like</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onChat(); }}
          className="flex flex-col items-center gap-1"
          title="Chat with host"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border",
              isLight ? "bg-white/70 border-black/10" : "bg-black/40 border-white/15"
            )}
            style={{ borderColor: `${activeColor}30` }}
          >
            <MessageCircle className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} style={{ color: activeColor }} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/60" : "text-white/60")}>Chat</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onShare(); }}
          className="flex flex-col items-center gap-1"
          title="Share event"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border",
              isLight ? "bg-white/70 border-black/10" : "bg-black/40 border-white/15"
            )}
            style={{ borderColor: `${activeColor}30` }}
          >
            <Share2 className={cn("w-5 h-5", isLight ? "text-black" : "text-white")} style={{ color: activeColor }} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/60" : "text-white/60")}>Share</span>
        </button>
      </div>

      {/* Details overlay */}
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
              {event.image_url && (
                <img src={event.image_url} className={cn("w-full h-full object-cover", isLight ? "opacity-80" : "opacity-90")} alt="" />
              )}
              <div className={cn("absolute inset-0", isLight ? "bg-gradient-to-t from-white via-white/40 to-transparent" : "bg-gradient-to-t from-black via-black/40 to-transparent")} />
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
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Date</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{formatDate(event.event_date)}</div>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className={cn("flex items-start gap-3 p-3 rounded-2xl", isLight ? "bg-black/5" : "bg-white/5")}>
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Location</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{event.location}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { handleLike(); }}
                  className={cn(
                    "py-4 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border transition-all shrink-0",
                    liked
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-500"
                      : isLight ? "text-black bg-black/5 border-black/10" : "text-white bg-white/10 border-white/15"
                  )}
                  title={liked ? "Unsave event" : "Save event"}
                >
                  <Bookmark className={cn("w-4 h-4", liked && "fill-orange-500")} />
                  {liked ? 'Saved' : 'Save'}
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

