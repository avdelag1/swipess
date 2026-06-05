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

    // Parse media fragment (e.g. video.mp4#t=5.5,15.5)
    const tMatch = src.match(/#t=([\d.]+),([\d.]+)/);
    const loopStart = tMatch ? parseFloat(tMatch[1]) : 0;
    const loopEnd = tMatch ? parseFloat(tMatch[2]) : Infinity;

    let direction: 1 | -1 = 1;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!inViewRef.current || el.readyState < 2) {
        last = now;
        return;
      }
      
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      
      if (direction === -1) {
        const next = el.currentTime - dt;
        if (next <= loopStart) {
          el.currentTime = loopStart;
          direction = 1;
          el.play().catch(() => {});
        } else {
          el.currentTime = next;
        }
      } else {
        // Forward mode
        if (el.currentTime >= loopEnd) {
            direction = -1;
            el.pause();
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
      className={cn('w-full h-full object-cover', className)}
    />
  );
}