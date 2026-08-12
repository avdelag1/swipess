import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type VideoHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { playMediaFromGesture, unlockMediaPlayback } from '@/utils/mediaUnlock';

export type LoopVideoHandle = {
  /** Apply mute + play inside the same user gesture (required on iOS). */
  applySoundFromGesture: (soundOn: boolean) => void;
  playFromGesture: () => void;
  getElement: () => HTMLVideoElement | null;
};

/**
 * LoopVideo — auto-playing video for swipe cards / event reels.
 *
 * Rules:
 * - Poster stays visible until a decoded frame is ready (no black gap)
 * - `active` plays; `warm` preloads adjacent cards without playing
 * - Mute changes must NOT pause — iOS rejects unmuted play() outside a gesture
 * - Use applySoundFromGesture() from mute-button onClick for sound
 */
export const LoopVideo = forwardRef<
  LoopVideoHandle,
  {
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
  }
>(function LoopVideo(
  {
    src,
    poster,
    className,
    active = true,
    warm = false,
    muted = true,
    loop = true,
    onEnded,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cleanSrc = src.split('#')[0];
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const shouldAttach = active || warm;
  const [hasFrame, setHasFrame] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      applySoundFromGesture(soundOn: boolean) {
        const el = videoRef.current;
        if (!el) {
          unlockMediaPlayback();
          return;
        }
        el.muted = !soundOn;
        if (active) playMediaFromGesture(el);
        else unlockMediaPlayback();
      },
      playFromGesture() {
        playMediaFromGesture(videoRef.current);
      },
      getElement() {
        return videoRef.current;
      },
    }),
    [active],
  );

  useEffect(() => {
    setHasFrame(false);
  }, [cleanSrc]);

  // Mute only — never pause/replay here (that breaks iOS after unmute)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
  }, [muted, shouldAttach, cleanSrc]);

  // Loop flag
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.loop = loop;
  }, [loop, shouldAttach, cleanSrc]);

  // Play / pause / warm based on visibility + active
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !shouldAttach) return;

    const markFrame = () => setHasFrame(true);

    const tryPlay = () => {
      if (!active) return;
      // Always muted autoplay path — iOS allows this without a gesture
      el.muted = muted;
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(() => markFrame()).catch(() => {
          // Retry once after a tick (common after display:none → flex remount)
          window.setTimeout(() => {
            el.play().then(() => markFrame()).catch(() => {});
          }, 120);
        });
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (active) el.pause();
          return;
        }
        tryPlay();
      },
      { threshold: 0.15 },
    );
    io.observe(el);

    if (!active) {
      el.pause();
      try {
        if (el.readyState < 2) el.load();
      } catch {
        /* ignore */
      }
      return () => io.disconnect();
    }

    if (el.readyState >= 2) {
      markFrame();
      tryPlay();
    } else {
      const onReady = () => {
        markFrame();
        tryPlay();
      };
      el.addEventListener('loadeddata', onReady, { once: true });
      el.addEventListener('canplay', onReady, { once: true });
      el.addEventListener('playing', markFrame);
      try {
        el.load();
      } catch {
        /* ignore */
      }
      tryPlay();
    }

    // Visibility / page-show — PersistentEventsScene toggles display
    const onVis = () => {
      if (document.visibilityState === 'visible' && active) tryPlay();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      el.pause();
    };
  }, [active, warm, cleanSrc, shouldAttach, muted]);

  useEffect(() => {
    const el = videoRef.current;
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
          ref={videoRef}
          key={cleanSrc}
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
          onCanPlay={() => setHasFrame(true)}
          onPlaying={() => setHasFrame(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            // Keep video visible while active even before first frame paints
            active || hasFrame ? 'opacity-100' : 'opacity-0',
            'transition-opacity duration-100',
          )}
        />
      ) : null}
    </div>
  );
});
