import { useEffect, useRef, type VideoHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * LoopVideo — auto-playing looping video for swipe cards / event reels.
 * Muted by default so iOS/Android allow autoplay; pass muted={false} after a user gesture.
 */
export function LoopVideo({
  src,
  poster,
  className,
  active = true,
  muted = true,
}: {
  src: string;
  poster?: string;
  className?: string;
  active?: boolean;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
        else if (active) el.play().catch(() => {});
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, src]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = muted;
    if (active) {
      const play = () => el.play().catch(() => {});
      if (el.readyState >= 2) play();
      else el.addEventListener('loadeddata', play, { once: true });
    } else {
      el.pause();
    }
  }, [active, muted, src]);

  const cleanSrc = src.split('#')[0];

  return (
    <video
      ref={ref}
      key={cleanSrc}
      src={cleanSrc}
      poster={poster}
      muted={muted}
      autoPlay={active}
      loop
      playsInline
      {...({ 'webkit-playsinline': 'true' } as VideoHTMLAttributes<HTMLVideoElement>)}
      preload="auto"
      disablePictureInPicture
      controls={false}
      className={cn('w-full h-full object-cover bg-black', className)}
    />
  );
}
