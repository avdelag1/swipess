import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEventsDeck } from '@/hooks/useEventsDeck';
import { LoopVideo } from '@/components/video/LoopVideo';
import { cn } from '@/lib/utils';
import { PartyPopper } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { EVENTS_FEED_PATH } from '@/constants/eventsRoutes';
import { EventVideoMuteButton } from '@/components/events/EventVideoMuteButton';

const ROTATE_MS = 5000;
/** Same swipe threshold as QuickFilterImage carousel */
const SWIPE_THRESHOLD = 20;

/**
 * Events quick-filter — same left/right carousel gesture as other bento cards.
 * Tap → main Events feed. Corner mute toggles sound only.
 */
export function EventsVideoQuickFilter({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventsDeck(true);

  const videoEvents = events.filter((ev) => ev.video_url && ev.video_url.trim().length > 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [soundOn, setSoundOn] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDragging = useRef(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoEvents.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % videoEvents.length);
    }, ROTATE_MS);
  }, [videoEvents.length]);

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTimer]);

  useEffect(() => {
    if (currentIndex >= videoEvents.length) setCurrentIndex(0);
  }, [videoEvents.length, currentIndex]);

  const currentEvent = videoEvents[currentIndex] || videoEvents[0];

  useEffect(() => {
    setSoundOn(false);
  }, [currentEvent?.id]);

  useEffect(() => {
    const url = currentEvent?.background_music_url?.trim();
    if (!url || !soundOn) {
      bgMusicRef.current?.pause();
      return;
    }
    let audio = bgMusicRef.current;
    if (!audio || audio.src !== url) {
      audio?.pause();
      audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.5;
      bgMusicRef.current = audio;
    }
    audio.play().catch(() => {});
    return () => {
      audio?.pause();
    };
  }, [currentEvent?.background_music_url, currentEvent?.id, soundOn]);

  const goNext = useCallback(() => {
    if (videoEvents.length <= 1) return;
    triggerHaptic('light');
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % videoEvents.length);
    startTimer();
  }, [videoEvents.length, startTimer]);

  const goPrev = useCallback(() => {
    if (videoEvents.length <= 1) return;
    triggerHaptic('light');
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? videoEvents.length - 1 : prev - 1));
    startTimer();
  }, [videoEvents.length, startTimer]);

  const openFeed = () => {
    triggerHaptic('success');
    navigate(EVENTS_FEED_PATH);
  };

  if (isLoading || videoEvents.length === 0) {
    return (
      <div
        onClick={openFeed}
        className={cn(
          'relative w-full h-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 flex flex-col justify-end cursor-pointer',
          className,
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <PartyPopper className="w-10 h-10 text-white/70" />
        </div>
        <div className="relative z-20 p-2 sm:p-4 w-full">
          <h3 className="text-white font-black italic uppercase tracking-wider text-sm sm:text-base mb-0.5 drop-shadow-md leading-tight">
            Events
          </h3>
          <p className="text-white/80 font-medium text-[9px] sm:text-[10px] leading-snug tracking-wide drop-shadow">
            Discover Local
          </p>
        </div>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
  };

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-[2rem] overflow-hidden bg-black cursor-pointer gpu-ultra',
        className,
      )}
      onClick={() => {
        if (isDragging.current) return;
        openFeed();
      }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentEvent.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          <LoopVideo
            src={currentEvent.video_url!}
            poster={currentEvent.image_url || undefined}
            className="w-full h-full object-cover scale-[1.02]"
            active
            muted={!soundOn}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-[11] bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />

      {/* Same pattern as QuickFilterImage: invisible drag layer for L/R carousel */}
      {videoEvents.length > 1 && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => {
            isDragging.current = true;
          }}
          onDragEnd={(_e, info) => {
            window.setTimeout(() => {
              isDragging.current = false;
            }, 50);
            if (info.offset.x < -SWIPE_THRESHOLD) goNext();
            else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
          }}
          onClickCapture={(e) => {
            if (isDragging.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing touch-pan-y"
          aria-hidden
        />
      )}

      {/* Pagination dots — same affordance as other quick-filter carousels */}
      {videoEvents.length > 1 && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-[4px] z-30 pointer-events-none drop-shadow-md">
          {videoEvents.map((_, i) => (
            <div
              key={videoEvents[i]?.id ?? i}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i === currentIndex
                  ? 'w-3.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : 'w-1.5 bg-white/40 shadow-[0_0_2px_rgba(0,0,0,0.5)]',
              )}
            />
          ))}
        </div>
      )}

      {/* Tiny glass mute — top-right (above drag layer) */}
      <div className="absolute top-2 right-2 z-40 pointer-events-auto">
        <EventVideoMuteButton
          soundOn={soundOn}
          onToggle={() => setSoundOn((v) => !v)}
          size="xs"
        />
      </div>

      <div className="relative z-30 p-2 sm:p-4 w-full h-full flex flex-col justify-end pointer-events-none">
        <h3 className="text-white font-black italic uppercase tracking-wider text-sm sm:text-base mb-0.5 drop-shadow-md leading-tight line-clamp-2">
          {currentEvent.title}
        </h3>
        <p className="text-white/80 font-medium text-[9px] sm:text-[10px] leading-snug tracking-wide drop-shadow truncate">
          {currentEvent.location || 'Local Event'}
        </p>
      </div>
    </div>
  );
}
