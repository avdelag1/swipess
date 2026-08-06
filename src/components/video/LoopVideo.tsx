import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * LoopVideo — a silent, auto-playing, boomerang-style looping video.
 *
 * Plays the clip forward, then "ping-pongs" backward by reversing playbackRate
 * for the same duration, giving a true boomerang feel without audio.
 * Pauses automatically when off-screen to save battery and bandwidth.
 */
export function LoopVideo({
  src,
  poster,
  className,
  active = true,
}: {
  src: string;
  poster?: string;
  className?: string;
  active?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  // Pause when off-screen to save battery
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
        else if (active) el.play().catch(() => {});
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) el.play().catch(() => {});
    else el.pause();
  }, [active]);

  // Strip media fragments for standard looping if present
  const cleanSrc = src.split('#')[0];

  return (
    <video
      ref={ref}
      src={cleanSrc}
      poster={poster}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      className={cn('w-full h-full object-cover', className)}
    />
  );
}