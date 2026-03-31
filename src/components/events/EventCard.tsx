import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, ChevronUp, Calendar, MapPin, Ticket, Sparkles } from 'lucide-react';
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
}: {
  event: EventItem; isActive: boolean; isPaused: boolean; animKey: number; onTickComplete: () => void; onLike: () => void; liked: boolean;
  onChat: () => void; onShare: () => void; onMiddleTap: () => void;
  onNextEvent: () => void; onPrevEvent: () => void;
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
        "relative w-full h-full overflow-hidden transition-colors duration-500",
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
      
      {/* Background photo with breathing-zoom on all cards */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-full h-full">
          <CardImage
            src={event.image_url}
            alt={event.title}
            fullScreen
            animate={true}
            priority={isActive} // 🚀 SPEED BOOST: Only the active card gets high priority loading
          />
        </div>
      </div>

      {/* Gradient overlays */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-700",
        isLight 
          ? "bg-gradient-to-t from-white/95 via-white/20 to-white/40 opacity-90" 
          : "bg-gradient-to-t from-black/90 via-black/10 to-black/40"
      )} />

      {/* Tap zones */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrevEvent(); }}
        className="absolute left-0 top-[8%] bottom-[40%] w-[30%] z-10 flex items-center justify-start pl-3"
        aria-label="Previous event"
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 active:opacity-100 transition-opacity"
          style={{ 
            background: isLight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', 
            backdropFilter: 'blur(8px)', 
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' 
          }}>
          <ChevronLeft className={cn("w-4 h-4", isLight ? "text-black" : "text-white")} />
        </div>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onMiddleTap(); }}
        className="absolute inset-x-[30%] top-[8%] bottom-[40%] z-10"
        aria-label="View event details"
      />

      <button
        onClick={(e) => { e.stopPropagation(); onNextEvent(); }}
        className="absolute right-0 top-[8%] bottom-[40%] w-[30%] z-10 flex items-center justify-end pr-3"
        aria-label="Next event"
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 active:opacity-100 transition-opacity"
          style={{ 
            background: isLight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', 
            backdropFilter: 'blur(8px)', 
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' 
          }}>
          <ChevronRight className={cn("w-4 h-4", isLight ? "text-black" : "text-white")} />
        </div>
      </button>

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
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side action buttons */}
      <div className="absolute right-4 flex flex-col gap-6 items-center z-30"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom,0px))' }}>
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); handleLike(); }}
          className="flex flex-col items-center gap-1"
        >
          <motion.div whileTap={{ scale: 0.85 }} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: liked ? 'rgba(239,68,68,0.3)' : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)'), 
              backdropFilter: 'blur(8px)', 
              border: `1px solid ${liked ? 'rgba(239,68,68,0.5)' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)')}`
            }}>
            <Heart className={cn('w-6 h-6 transition-colors', liked ? 'fill-red-500 text-red-500' : (isLight ? 'text-black' : 'text-white'))} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/60" : "text-white/60")}>Like</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onChat(); }} className="flex flex-col items-center gap-1">
          <motion.div whileTap={{ scale: 0.85 }} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', 
              backdropFilter: 'blur(8px)', 
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)' 
            }}>
            <MessageCircle className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/60" : "text-white/60")}>Chat</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onShare(); }} className="flex flex-col items-center gap-1">
          <motion.div whileTap={{ scale: 0.85 }} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', 
              backdropFilter: 'blur(8px)', 
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)' 
            }}>
            <Share2 className={cn("w-5 h-5", isLight ? "text-black" : "text-white")} />
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
            className="absolute inset-0 z-50 overflow-y-auto"
            style={{ background: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(0,0,0,0.96)', backdropFilter: 'blur(20px)' }}
          >
            <div className="relative h-[45dvh]">
              {event.image_url && (
                <img src={event.image_url} className={cn("w-full h-full object-cover", isLight ? "opacity-30" : "opacity-60")} alt="" />
              )}
              <div className={cn("absolute inset-0", isLight ? "bg-gradient-to-t from-white via-white/40 to-transparent" : "bg-gradient-to-t from-black via-black/40 to-transparent")} />
              <button onClick={() => setShowDetails(false)} className="absolute top-safe top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
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
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                    <Calendar className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Date</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{formatDate(event.event_date)}</div>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Location</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{event.location}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => onChat()} className={cn("flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2", isLight ? "text-black bg-black/5 border-black/10" : "text-white bg-white/10 border-white/15")} style={{ border: '1px solid' }}>
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </button>
                <button onClick={() => onShare()} className="flex-1 py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#f97316,#a855f7)' }}>
                  <Share2 className="w-4 h-4" /> Share Event
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
