import React, { useEffect, useState } from 'react';

interface BackgroundCard {
  id: string;
  imageUrl: string;
  laneIndex: number;
  cardIndex: number;
}

interface AmbientSwipeBackgroundProps {
  isPaused?: boolean;
  className?: string;
}

// Diagonal lane configurations (direction vectors)
const LANE_CONFIGS = [
  {
    // Lane 0: Bottom-left → Top-right (ascending)
    startX: -15,
    startY: 115,
    endX: 115,
    endY: -15,
    duration: 40, // seconds
  },
  {
    // Lane 1: Top-right → Bottom-left (descending)
    startX: 115,
    startY: -15,
    endX: -15,
    endY: 115,
    duration: 45,
  },
  {
    // Lane 2: Bottom-right → Top-left (ascending opposite)
    startX: 115,
    startY: 115,
    endX: -15,
    endY: -15,
    duration: 42,
  },
];

// Sample placeholder cards - using local placeholders instead of external images
// These are simple gradient placeholders that create the ambient swipe effect
const SAMPLE_IMAGES = [
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
];

/**
 * AmbientSwipeBackground - Diagonal carousel of swipe cards as ambient background
 *
 * DESIGN PHILOSOPHY:
 * This is "emotional UX, not functional UI" - the background communicates
 * "this is a swipe marketplace" at first glance without being intrusive.
 *
 * CORE FEATURES:
 * - Multiple diagonal lanes with different movement directions (fashion runway feel)
 * - Seamless infinite looping using CSS keyframes (no visible resets)
 * - GPU-accelerated transforms only (translate, opacity)
 * - Respects reduced motion preferences & low-end devices
 * - Non-interactive (pointer-events: none, sits at z-index: -1)
 * - Slows down when user is swiping (via isPaused prop)
 *
 * PERFORMANCE SAFEGUARDS:
 * - Disabled entirely on reduced-motion preference
 * - Disabled on devices with < 4 CPU cores
 * - Uses CSS animations (off main thread)
 * - Lazy-loaded images
 * - No React re-renders during animation
 */
export const AmbientSwipeBackground: React.FC<AmbientSwipeBackgroundProps> = ({
  isPaused = false,
  className = '',
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [cards] = useState<BackgroundCard[]>(() =>
    // Generate 4 cards per lane for continuous coverage without gaps
    LANE_CONFIGS.flatMap((_, laneIndex) =>
      Array.from({ length: 4 }, (_, cardIndex) => ({
        id: `lane-${laneIndex}-card-${cardIndex}`,
        imageUrl: SAMPLE_IMAGES[(laneIndex * 4 + cardIndex) % SAMPLE_IMAGES.length],
        laneIndex,
        cardIndex,
      }))
    )
  );

  // Performance & accessibility checks
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    if (prefersReducedMotion || isLowEndDevice) {
      setIsEnabled(false);
    }
  }, []);

  // Inject CSS keyframes dynamically for each lane
  useEffect(() => {
    if (!isEnabled) return;

    const styleId = 'ambient-swipe-keyframes';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = LANE_CONFIGS.map(
      (config, index) => `
        @keyframes ambient-lane-${index} {
          0% {
            transform: translate(${config.startX}vw, ${config.startY}vh) translateZ(0);
          }
          100% {
            transform: translate(${config.endX}vw, ${config.endY}vh) translateZ(0);
          }
        }
      `
    ).join('\n');

    document.head.appendChild(style);

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        zIndex: -1, // Below everything - won't interfere with any UI
        opacity: 1,
      }}
    >
      {/* Subtle dark overlay to ensure background cards don't compete with main card */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{ zIndex: 1 }}
      />

      {/* Diagonal lanes of cards */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        {cards.map((card) => (
          <AmbientCard key={card.id} card={card} isPaused={isPaused} />
        ))}
      </div>
    </div>
  );
};

interface AmbientCardProps {
  card: BackgroundCard;
  isPaused: boolean;
}

const AmbientCard: React.FC<AmbientCardProps> = React.memo(({ card, isPaused }) => {
  const laneConfig = LANE_CONFIGS[card.laneIndex];

  // Stagger cards within each lane (0%, 25%, 50%, 75% delay)
  // Using negative animation-delay creates the effect of cards already in motion
  const delayPercent = card.cardIndex * 25;
  const delaySeconds = -(laneConfig.duration * delayPercent) / 100;

  return (
    <div
      className="absolute"
      style={{
        width: '180px', // Smaller than main cards (which are full-screen)
        height: '260px',
        left: 0,
        top: 0,
        // CSS animation for infinite loop (most performant)
        animation: `ambient-lane-${card.laneIndex} ${laneConfig.duration}s linear infinite`,
        animationDelay: `${delaySeconds}s`,
        // Slow down to 0.25x speed when paused (subtle slow-mo effect)
        animationPlayState: isPaused ? 'running' : 'running',
        animationDuration: isPaused
          ? `${laneConfig.duration * 4}s`
          : `${laneConfig.duration}s`,
        // GPU acceleration
        willChange: 'transform',
        transform: 'translateZ(0)',
        // Smooth transition when pausing/resuming
        transitionProperty: 'animation-duration',
        transitionDuration: '0.8s',
        transitionTimingFunction: 'ease-out',
      }}
    >
      <div
        className="w-full h-full rounded-3xl overflow-hidden shadow-2xl"
        style={{
          // Match main card rounded corners (24px)
          borderRadius: '24px',
          // Reduced opacity and subtle blur for ambient feel
          // Should look like ghosted cards in the background
          opacity: 0.2,
          filter: 'blur(1.5px)',
          // GPU acceleration
          transform: 'translateZ(0)',
          willChange: 'opacity',
        }}
      >
        <img
          src={card.imageUrl}
          alt=""
          className="w-full h-full object-cover"
          style={{
            // GPU acceleration
            transform: 'translateZ(0)',
          }}
          loading="lazy"
        />
      </div>
    </div>
  );
});

AmbientCard.displayName = 'AmbientCard';
