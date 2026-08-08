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

/** Same swipe threshold as QuickFilterImage carousel */
const SWIPE_THRESHOLD = 20;
/** Fast vanish between clips */
const VANISH_MS = 0.2;
const TITLE_MS = 0.16;

/**
 * Events quick-filter — L/R carousel like other bento cards.
 * Each video plays fully, then advances. Tap → Events feed.
 */
export function EventsVideoQuickFilter({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventsDeck(true);

  const videoEvents = events.filter((ev) => ev.video_url && ev.video_url.trim().length > 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [soundOn, setSoundOn] = useState(false);
  const isDragging = useRef(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentIndex >= videoEvents.length) setCurrentIndex(0);
  }, [videoEvents.length, currentIndex]);

  const currentEvent = videoEvents[currentIndex] || videoEvents[0];
  const multi = videoEvents.length > 1;

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

  const goNext = useCallback((haptic = true) => {
    if (videoEvents.length <= 1) return;
    if (haptic) triggerHaptic('light');
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % videoEvents.length);
  }, [videoEvents.length]);

  const goPrev = useCallback(() => {
    if (videoEvents.length <= 1) return;
    triggerHaptic('light');
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? videoEvents.length - 1 : prev - 1));
  }, [videoEvents.length]);

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

  const vanishVariants = {
    enter: {
      opacity: 0,
      scale: 1.04,
      filter: 'blur(8px)',
    },
    center: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      zIndex: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.94,
      filter: 'blur(10px)',
      zIndex: 0,
    },
  };

  const titleVariants = {
    enter: { opacity: 0, y: 6 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
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
      <div className="absolute inset-0 z-0 bg-black" aria-hidden />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentEvent.id}
          variants={vanishVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: VANISH_MS,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          <LoopVideo
            src={currentEvent.video_url!}
            poster={currentEvent.image_url || undefined}
            className="w-full h-full object-cover scale-[1.02]"
            active
            muted={!soundOn}
            // Multi: play full clip once then advance. Solo: keep looping.
            loop={!multi}
            onEnded={multi ? () => goNext(false) : undefined}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-[11] bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />

      {multi && (
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

      {multi && (
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

      <div className="absolute top-2 right-2 z-40 pointer-events-auto">
        <EventVideoMuteButton
          soundOn={soundOn}
          onToggle={() => setSoundOn((v) => !v)}
          size="xs"
        />
      </div>

      <div className="relative z-30 p-2 sm:p-4 w-full h-full flex flex-col justify-end pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`title-${currentEvent.id}`}
            variants={titleVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: TITLE_MS, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <h3 className="text-white font-black italic uppercase tracking-wider text-sm sm:text-base mb-0.5 drop-shadow-md leading-tight line-clamp-2">
              {currentEvent.title}
            </h3>
            <p className="text-white/80 font-medium text-[9px] sm:text-[10px] leading-snug tracking-wide drop-shadow truncate">
              {currentEvent.location || 'Local Event'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
