import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
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

export function EventsVideoQuickFilter({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventsDeck(true);

  const videoEvents = events.filter((ev) => ev.video_url && ev.video_url.trim().length > 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [soundOn, setSoundOn] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Mute when card rotates to next event
  useEffect(() => {
    setSoundOn(false);
  }, [currentEvent?.id]);

  const handleNext = (e?: SyntheticEvent) => {
    e?.stopPropagation();
    if (videoEvents.length <= 1) return;
    triggerHaptic('light');
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % videoEvents.length);
    startTimer();
  };

  const handlePrev = (e?: SyntheticEvent) => {
    e?.stopPropagation();
    if (videoEvents.length <= 1) return;
    triggerHaptic('light');
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? videoEvents.length - 1 : prev - 1));
    startTimer();
  };

  const handleDragEnd = (_e: unknown, info: { offset: { x: number } }) => {
    const swipe = info.offset.x;
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
          'relative w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 flex flex-col items-center justify-center shadow-xl cursor-pointer active:scale-95 transition-transform duration-200',
          className,
        )}
      >
        <PartyPopper className="w-12 h-12 text-white mb-4 opacity-80" />
        <h3 className="text-white font-bold text-xl tracking-tight">Events</h3>
        <p className="text-white/80 text-sm mt-1">Discover Local</p>
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
        'relative w-full h-full rounded-[2.5rem] overflow-hidden bg-black shadow-[0_20px_40px_-15px_rgba(236,72,153,0.5)] cursor-pointer touch-none active:scale-[0.98] transition-transform duration-300 gpu-ultra group',
        className,
      )}
      onClick={() => {
        triggerHaptic('success');
        navigate(`/explore/events/${currentEvent.id}`, {
          state: {
            eventData: currentEvent,
            eventIds: events.map((e) => e.id),
          },
        });
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
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
          className="absolute inset-0 w-full h-full"
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/60 pointer-events-none" />

      {/* Left / right hit zones for manual swipe change */}
      <button
        type="button"
        aria-label="Previous event video"
        className="absolute left-0 top-0 bottom-0 w-[28%] z-20"
        onClick={handlePrev}
      />
      <button
        type="button"
        aria-label="Next event video"
        className="absolute right-0 top-0 bottom-0 w-[28%] z-20"
        onClick={handleNext}
      />

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-30 pointer-events-none">
        <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
          <PartyPopper className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-white text-[10px] font-semibold tracking-wide uppercase">Live</span>
        </div>
        <EventVideoMuteButton
          soundOn={soundOn}
          onToggle={() => setSoundOn((v) => !v)}
          size="sm"
        />
      </div>

      <div className="absolute bottom-6 left-4 right-4 z-10 pointer-events-none">
        <h3 className="text-white font-bold text-xl leading-tight line-clamp-2 drop-shadow-lg">
          {currentEvent.title}
        </h3>
        <p className="text-white/90 text-xs font-medium mt-1 truncate drop-shadow-md">
          {currentEvent.location || 'Local Event'}
        </p>
      </div>

      {videoEvents.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1.5 z-10 pointer-events-none">
          {videoEvents.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === currentIndex
                  ? 'w-4 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]'
                  : 'w-1.5 bg-white/40',
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
