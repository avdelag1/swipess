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
  onError,
}: {
  src: string;
  poster?: string;
  className?: string;
  active?: boolean;
  onError?: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const inViewRef = useRef(true);

  // Pause when off-screen to save battery
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) el.pause();
        else if (active) el.play().catch(() => {});
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  // Boomerang ping-pong: reverse playback at end, return to forward at start
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let direction: 1 | -1 = 1;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!inViewRef.current || el.paused || el.readyState < 2) {
        last = now;
        return;
      }
      const dt = (now - last) / 1000;
      last = now;
      if (direction === -1) {
        // Manually rewind because most browsers ignore negative playbackRate
        const next = el.currentTime - dt;
        if (next <= 0) {
          el.currentTime = 0;
          direction = 1;
          el.play().catch(() => {});
        } else {
          el.currentTime = next;
        }
      }
    };

    const onEnded = () => {
      direction = -1;
      el.pause();
    };

    el.addEventListener('ended', onEnded);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('ended', onEnded);
    };
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) el.play().catch(() => {});
    else el.pause();
  }, [active]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      autoPlay
      playsInline
      // No `loop` attr — we control looping manually for ping-pong
      preload="metadata"
      disablePictureInPicture
      onError={onError}
      className={cn('w-full h-full object-cover', className)}
    />
  );
}