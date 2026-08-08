import { useEffect, useRef, useState, type VideoHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * LoopVideo — auto-playing video for swipe cards / event reels.
 *
 * Rules:
 * - Poster stays visible until a decoded frame is ready (no black gap)
 * - `active` plays; `warm` preloads adjacent cards without playing
 * - Only active video plays; warm stays paused
 * - No remount on active toggle (stable key) so transitions stay instant
 */
export function LoopVideo({
  src,
  poster,
  className,
  active = true,
  warm = false,
  muted = true,
  loop = true,
  onEnded,
}: {
  src: string;
  poster?: string;
  className?: string;
  active?: boolean;
  /** Preload this video while inactive (next/prev card). */
  warm?: boolean;
  muted?: boolean;
  /** When false, plays once then fires onEnded (carousel advances). */
  loop?: boolean;
  onEnded?: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const cleanSrc = src.split('#')[0];
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const shouldAttach = active || warm;
  const [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    // New source → wait for a real frame again (poster covers meanwhile)
    setHasFrame(false);
  }, [cleanSrc]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.pause();
          return;
        }
        if (active) el.play().catch(() => {});
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, cleanSrc, shouldAttach]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !shouldAttach) return;

    el.muted = muted;
    el.loop = loop;

    if (!active) {
      el.pause();
      // Warm: ensure bytes are buffering without playback
      try {
        if (el.readyState < 2) el.load();
      } catch {
        /* ignore */
      }
      return;
    }

    const markFrame = () => setHasFrame(true);
    const play = () => {
      el.play()
        .then(() => markFrame())
        .catch(() => {});
    };

    if (el.readyState >= 2) {
      markFrame();
      play();
    } else {
      el.addEventListener('loadeddata', () => {
        markFrame();
        play();
      }, { once: true });
      el.addEventListener('playing', markFrame, { once: true });
    }

    return () => {
      el.pause();
    };
  }, [active, warm, muted, loop, cleanSrc, shouldAttach]);

  useEffect(() => {
    const el = ref.current;
    if (!el || loop || !active) return;
    const handleEnded = () => onEndedRef.current?.();
    el.addEventListener('ended', handleEnded);
    return () => el.removeEventListener('ended', handleEnded);
  }, [loop, cleanSrc, active]);

  const preload: 'auto' | 'metadata' | 'none' = active
    ? 'auto'
    : warm
      ? 'auto'
      : 'none';

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-transparent', className)}>
      {/* Always-on poster — covers until video has a painted frame */}
      {poster ? (
        <img
          src={poster}
          alt=""
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            opacity: hasFrame && active ? 0 : 1,
            transition: 'opacity 120ms linear',
          }}
        />
      ) : null}

      {shouldAttach ? (
        <video
          ref={ref}
          src={cleanSrc}
          poster={poster}
          muted={muted}
          autoPlay={active}
          loop={loop}
          playsInline
          {...({ 'webkit-playsinline': 'true' } as VideoHTMLAttributes<HTMLVideoElement>)}
          preload={preload}
          disablePictureInPicture
          controls={false}
          onLoadedData={() => setHasFrame(true)}
          onPlaying={() => setHasFrame(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            // Transparent until first frame so poster shows through (never flash black)
            hasFrame ? 'opacity-100' : 'opacity-0',
            'transition-opacity duration-100',
          )}
        />
      ) : null}
    </div>
  );
}
