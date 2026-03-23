import React, { useEffect, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

// Import animations
import profileAnim from '@/assets/animations/profile-bubbly.json';
import flameAnim from '@/assets/animations/flame-pulse.json';
import aiAnim from '@/assets/animations/ai-sparkle.json';
import messageAnim from '@/assets/animations/message-pop.json';
import compassAnim from '@/assets/animations/compass-elastic.json';
import genericAnim from '@/assets/animations/generic-pop.json';
import heartAnim from '@/assets/animations/heart-elastic.json';
import dislikeAnim from '@/assets/animations/dislike-elastic.json';

type IconType = 'profile' | 'likes' | 'ai-search' | 'messages' | 'browse' | 'heart' | 'dislike' | string;

interface AnimatedLottieIconProps {
  iconId: IconType;
  active: boolean;
  size?: number;
  className?: string;
  inactiveIcon?: React.ReactNode;
}

const ANIMATION_MAP: Record<string, any> = {
  profile: profileAnim,
  likes: flameAnim,
  'ai-search': aiAnim,
  messages: messageAnim,
  browse: compassAnim,
  heart: heartAnim,
  dislike: dislikeAnim,
};

export const AnimatedLottieIcon: React.FC<AnimatedLottieIconProps> = ({
  iconId,
  active,
  size = 24,
  className,
  inactiveIcon: _inactiveIcon
}) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (active && lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
    } else if (!active && lottieRef.current) {
      lottieRef.current.stop();
    }
  }, [active]);

  const animationData = ANIMATION_MAP[iconId] || genericAnim;

  return (
    <div 
      className={className} 
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: active ? 1 : 0.6,
        transition: 'opacity 0.2s ease'
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={active && iconId !== 'profile'} // Loop mostly for flame/sparkles
        autoplay={active}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
