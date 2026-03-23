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
import usersAnim from '@/assets/animations/users-bounce.json';
import megaphoneAnim from '@/assets/animations/megaphone-shout.json';
import searchAnim from '@/assets/animations/search-scan.json';

type IconType = 'profile' | 'likes' | 'ai-search' | 'messages' | 'browse' | 'heart' | 'dislike' | 'roommates' | 'eventos' | 'advertise' | 'filter' | string;

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
  roommates: usersAnim,
  eventos: megaphoneAnim,
  advertise: megaphoneAnim,
  filter: searchAnim,
};

export const AnimatedLottieIcon: React.FC<AnimatedLottieIconProps> = ({
  iconId,
  active,
  size = 24,
  className,
  inactiveIcon
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
        opacity: active ? 1 : 0.8,
        transition: 'opacity 0.2s ease',
        position: 'relative'
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          opacity: active ? 1 : 0,
          pointerEvents: active ? 'auto' : 'none',
          transition: 'opacity 0.2s ease-out',
          zIndex: 2
        }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={active && (iconId === 'likes' || iconId === 'ai-search' || iconId === 'browse')} 
          autoplay={active}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          opacity: active ? 0 : 1,
          pointerEvents: active ? 'none' : 'auto',
          transition: 'opacity 0.2s ease-in',
          zIndex: 1
        }}
      >
        {inactiveIcon}
      </div>
    </div>
  );
};
