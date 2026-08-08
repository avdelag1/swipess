import { useEffect, useRef, type VideoHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * LoopVideo — auto-playing video for swipe cards / event reels.
 * Muted by default so iOS/Android allow autoplay.
 *
 * Performance rules:
 * - Only the active card attaches `src` (no multi-video bandwidth storm)
 * - preload=metadata when active, none when inactive
 * - IntersectionObserver pauses when off-screen
 */
export function LoopVideo({
  src,
  poster,
  className,
  active = true,
  muted = true,
  loop = true,
  onEnded,
}: {
  src: string;
  poster?: string;
  className?: string;
  active?: boolean;
  muted?: boolean;
  /** When false, plays once then fires onEnded (carousel advances). */
  loop?: boolean;
  onEnded?: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const cleanSrc = src.split('#')[0];
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
        else if (active) el.play().catch(() => {});
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, cleanSrc]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = muted;
    el.loop = loop;

    if (!active) {
      el.pause();
      return;
    }

    const play = () => el.play().catch(() => {});
    if (el.readyState >= 2) play();
    else el.addEventListener('loadeddata', play, { once: true });

    return () => {
      el.pause();
    };
  }, [active, muted, loop, cleanSrc]);

  useEffect(() => {
    const el = ref.current;
    if (!el || loop) return;
    const handleEnded = () => onEndedRef.current?.();
    el.addEventListener('ended', handleEnded);
    return () => el.removeEventListener('ended', handleEnded);
  }, [loop, cleanSrc, active]);

  return (
    <video
      ref={ref}
      key={active ? cleanSrc : `idle-${cleanSrc}`}
      src={active ? cleanSrc : undefined}
      poster={poster}
      muted={muted}
      autoPlay={active}
      loop={loop}
      playsInline
      {...({ 'webkit-playsinline': 'true' } as VideoHTMLAttributes<HTMLVideoElement>)}
      preload={active ? 'metadata' : 'none'}
      disablePictureInPicture
      controls={false}
      className={cn('w-full h-full object-cover bg-black', className)}
    />
  );
}
