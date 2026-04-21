import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
const Lottie = lazy(() => import('lottie-react'));

// Lazy loaders — each JSON is a separate Vite chunk, loaded only on first press
const ANIMATION_LOADERS: Record<string, () => Promise<any>> = {
  profile:   () => import('@/assets/animations/profile-bubbly.json'),
  likes:     () => import('@/assets/animations/flame-pulse.json'),
  'ai-search': () => import('@/assets/animations/ai-sparkle.json'),
  messages:  () => import('@/assets/animations/message-pop.json'),
  browse:    () => import('@/assets/animations/compass-elastic.json'),
  heart:     () => import('@/assets/animations/heart-elastic.json'),
  dislike:   () => import('@/assets/animations/dislike-elastic.json'),
  roommates: () => import('@/assets/animations/users-bounce.json'),
  eventos:   () => import('@/assets/animations/megaphone-shout.json'),
  advertise: () => import('@/assets/animations/megaphone-shout.json'),
  filter:    () => import('@/assets/animations/search-scan.json'),
};

const genericLoader = () => import('@/assets/animations/generic-pop.json');

// Module-level cache so each animation is only fetched once per session
const animationCache = new Map<string, any>();

type IconType = 'profile' | 'likes' | 'ai-search' | 'messages' | 'browse' | 'heart' | 'dislike' | 'roommates' | 'eventos' | 'advertise' | 'filter' | string;

interface AnimatedLottieIconProps {
  iconId: IconType;
  active: boolean;
  size?: number;
  className?: string;
  inactiveIcon?: React.ReactNode;
}

export const AnimatedLottieIcon: React.FC<AnimatedLottieIconProps> = ({
  iconId,
  active,
  size = 24,
  className,
  inactiveIcon
}) => {
  const lottieRef = useRef<any>(null);
  const [animationData, setAnimationData] = useState<any>(() => animationCache.get(iconId) ?? null);

  // Load animation data lazily on first activation
  useEffect(() => {
    if (!active || animationCache.has(iconId)) {
      if (animationCache.has(iconId) && !animationData) {
        setAnimationData(animationCache.get(iconId));
      }
      return;
    }
    const loader = ANIMATION_LOADERS[iconId] ?? genericLoader;
    loader().then((mod) => {
      const data = mod.default ?? mod;
      animationCache.set(iconId, data);
      setAnimationData(data);
    });
  }, [active, iconId]);

  useEffect(() => {
    if (active && lottieRef.current) {
      if (typeof lottieRef.current.goToAndPlay === 'function') {
        lottieRef.current.goToAndPlay(0);
      }
    } else if (!active && lottieRef.current) {
      if (typeof lottieRef.current.stop === 'function') {
        lottieRef.current.stop();
      }
    }
  }, [active]);

  // When inactive, render the static fallback icon (no Lottie overhead)
  if (!active || !animationData) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {inactiveIcon || (
          <span style={{ color: '#ffffff', fontSize: size * 0.8 }}>●</span>
        )}
      </div>
    );
  }

  // When active and data is loaded, render the Lottie animation
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Suspense fallback={inactiveIcon}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={iconId !== 'profile'}
          autoplay={active}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
};

