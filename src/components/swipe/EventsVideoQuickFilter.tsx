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

/**
 * Events quick-filter tile — video + title like other bento cards,
 * with a tiny glassmorphic mute control in the corner.
 */
export function EventsVideoQuickFilter({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventsDeck(true);

  const videoEvents = events.filter((ev) => ev.video_url && ev.video_url.trim().length > 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [soundOn, setSoundOn] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragMovedRef = useRef(false);
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

  // Mute when card rotates to next event
  useEffect(() => {
    setSoundOn(false);
  }, [currentEvent?.id]);

  // Optional admin background bed + video unmute while sound is on
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

  const handleNext = () => {
    if (videoEvents.length <= 1) return;
    triggerHaptic('light');
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % videoEvents.length);
    startTimer();
  };

  const handlePrev = () => {
    if (videoEvents.length <= 1) return;
    triggerHaptic('light');
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? videoEvents.length - 1 : prev - 1));
    startTimer();
  };

  const handleDragEnd = (_e: unknown, info: { offset: { x: number } }) => {
    const swipe = info.offset.x;
    if (Math.abs(swipe) > 12) dragMovedRef.current = true;
    if (swipe < -30) handleNext();
    else if (swipe > 30) handlePrev();
  };

  if (isLoading || videoEvents.length === 0) {
    return (
      <div
        onClick={() => {
          triggerHaptic('medium');
          navigate(EVENTS_FEED_PATH);
        }}
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
    <motion.div
      className={cn(
        'relative w-full h-full rounded-[2rem] overflow-hidden bg-black cursor-pointer touch-none gpu-ultra',
        className,
      )}
      onClick={() => {
        if (dragMovedRef.current) {
          dragMovedRef.current = false;
          return;
        }
        triggerHaptic('success');
        // Quick-filter card → main Events feed (not event detail / insights)
        navigate(EVENTS_FEED_PATH);
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={() => {
        dragMovedRef.current = false;
      }}
      onDragEnd={handleDragEnd}
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
          className="absolute inset-0 w-full h-full pointer-events-none"
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

      {/* Tiny glass mute — top-right, soft pulse fade */}
      <div className="absolute top-2.5 right-2.5 z-30 pointer-events-auto">
        <EventVideoMuteButton
          soundOn={soundOn}
          onToggle={() => setSoundOn((v) => !v)}
          size="xs"
        />
      </div>

      <div className="relative z-20 p-2 sm:p-4 w-full h-full flex flex-col justify-end pointer-events-none">
        <h3 className="text-white font-black italic uppercase tracking-wider text-sm sm:text-base mb-0.5 drop-shadow-md leading-tight line-clamp-2">
          {currentEvent.title}
        </h3>
        <p className="text-white/80 font-medium text-[9px] sm:text-[10px] leading-snug tracking-wide drop-shadow truncate">
          {currentEvent.location || 'Local Event'}
        </p>
      </div>
    </motion.div>
  );
}
