import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { LoopVideo } from '@/components/video/LoopVideo';
import { EventVideoMuteButton } from '@/components/events/EventVideoMuteButton';
import { useDeckAudioStore } from '@/state/deckAudioStore';

interface QuickFilterImageProps {
  src: string | string[];
  alt: string;
  className?: string;
  animationDelay?: string;
  /** Show shared deck mute control (for upcoming videos + preference). */
  showMute?: boolean;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url === 'video_attachment') return true;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes('/videos/');
}

/**
 * Media for quick filter cards — images and videos, L/R swipe carousel.
 * Mute uses the shared deck audio preference (stays on across cards).
 */
export function QuickFilterImage({
  src,
  alt,
  className,
  animationDelay = '0s',
  showMute = true,
}: QuickFilterImageProps) {
  const images = Array.isArray(src) ? src : [src];
  const [activeIndex, setActiveIndex] = useState(0);
  const isDragging = React.useRef(false);
  const soundOn = useDeckAudioStore((s) => s.soundOn);
  const toggleSound = useDeckAudioStore((s) => s.toggleSound);

  useEffect(() => {
    if (images.length <= 1) return;

    const delayS = parseFloat(animationDelay.replace('s', '')) || 0;
    const baseInterval = 40000;
    const exactOffset = delayS * 1000;

    let timeoutId: ReturnType<typeof setTimeout>;

    const rotate = () => {
      setActiveIndex((prev) => (prev + 1) % images.length);
      timeoutId = setTimeout(rotate, baseInterval);
    };

    timeoutId = setTimeout(rotate, baseInterval + exactOffset);

    return () => clearTimeout(timeoutId);
  }, [images.length, animationDelay]);

  const current = images[activeIndex] || images[0];
  const currentIsVideo = isVideoUrl(current);

  const muteControl = showMute ? (
    <div className="absolute top-2 right-2 z-40 pointer-events-auto">
      <EventVideoMuteButton soundOn={soundOn} onToggle={toggleSound} size="xs" />
    </div>
  ) : null;

  if (images.length <= 1) {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/50">
        {currentIsVideo ? (
          <LoopVideo
            src={current}
            className={cn('absolute inset-0 w-full h-full object-cover', className)}
            active
            muted={!soundOn}
            loop
          />
        ) : (
          <img
            src={current}
            alt={alt}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={cn('absolute inset-0 w-full h-full object-cover', className)}
          />
        )}
        {muteControl}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/50 pointer-events-auto touch-pan-y">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDragEnd={(_e, info) => {
          setTimeout(() => {
            isDragging.current = false;
          }, 50);
          const threshold = 20;
          if (info.offset.x < -threshold) {
            setActiveIndex((prev) => (prev + 1) % images.length);
          } else if (info.offset.x > threshold) {
            setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
          }
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
        className="absolute inset-0 w-full h-full z-20 cursor-grab active:cursor-grabbing touch-pan-y"
      />

      <AnimatePresence>
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          {currentIsVideo ? (
            <LoopVideo
              src={current}
              className={cn('absolute inset-0 w-full h-full object-cover', className)}
              active
              muted={!soundOn}
              loop
            />
          ) : (
            <img
              src={current}
              alt={`${alt} ${activeIndex + 1}`}
              className={cn('absolute inset-0 w-full h-full object-cover', className)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots left — mute sits top-right */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-[4px] z-30 pointer-events-none drop-shadow-md">
        {images.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              i === activeIndex
                ? 'w-3.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                : 'w-1.5 bg-white/40 shadow-[0_0_2px_rgba(0,0,0,0.5)]',
            )}
          />
        ))}
      </div>

      {muteControl}
    </div>
  );
}
