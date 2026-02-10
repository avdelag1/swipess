import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';

/**
 * FIRE ORB - Living Glowing Orb Animation
 * 
 * The dot above the "i" in "Swipess" is replaced with a living fire orb.
 * The orb feels alive, curious, playful, and premium.
 * 
 * Animation Flow:
 * 1. Orb appears with glow
 * 2. Wanders around the logo curiously
 * 3. Returns and settles as the "dot" above the i
 * 4. Dims slightly, then repeats
 */

interface FireOrbProps {
  /** Whether the orb animation is active */
  isActive?: boolean;
  /** Size of the orb in pixels */
  size?: number;
  /** Callback when orb settles into position */
  onSettle?: () => void;
}

// Premium easing curves - cast as const for Framer Motion
const easeOutSoft = [0.22, 1, 0.36, 1] as const;
const easeInOutSmooth = [0.4, 0, 0.2, 1] as const;

function FireOrbComponent({ isActive = true, size = 12, onSettle }: FireOrbProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'hidden' | 'appear' | 'wander' | 'settle' | 'rest'>('appear');

  // Animation phase timing
  useEffect(() => {
    if (!isActive || prefersReducedMotion) {
      setPhase('settle'); // Just show static orb
      return;
    }

    // Start animation cycle
    const timeouts: NodeJS.Timeout[] = [];

    const runCycle = () => {
      // Start from appear state, not hidden
      setPhase('appear');

      // Wander: 600ms -> 4100ms (3.5s wander)
      timeouts.push(setTimeout(() => setPhase('wander'), 600));

      // Settle: 4100ms -> 4900ms (800ms settle)
      timeouts.push(setTimeout(() => {
        setPhase('settle');
        onSettle?.();
      }, 4100));

      // Rest: 4900ms -> 7400ms (2.5s rest)
      timeouts.push(setTimeout(() => setPhase('rest'), 4900));

      // Restart cycle
      timeouts.push(setTimeout(runCycle, 7400));
    };

    runCycle();

    return () => timeouts.forEach(clearTimeout);
  }, [isActive, prefersReducedMotion, onSettle]);

  // Reduce motion - just show static dot with enhanced glow
  if (prefersReducedMotion) {
    return (
      <div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background: 'radial-gradient(circle at 35% 35%, hsl(50 100% 75%) 0%, hsl(30 100% 55%) 50%, hsl(20 100% 45%) 100%)',
          boxShadow: `
            0 0 ${size * 0.8}px hsl(35 100% 60% / 0.9),
            0 0 ${size * 1.5}px hsl(30 100% 55% / 0.6),
            0 0 ${size * 2.5}px hsl(25 100% 50% / 0.4)
          `,
        }}
      />
    );
  }

  // Animation variants for each phase
  const orbVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.3,
      x: 0,
      y: 0,
    },
    appear: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: -2,
      transition: {
        duration: 0.6,
        ease: easeOutSoft,
      },
    },
    wander: {
      opacity: 1,
      scale: [1, 1.15, 0.95, 1.1, 1.05, 1],
      x: [0, 60, -80, 50, -35, 0],
      y: [-5, -70, -120, -60, -100, -5],
      transition: {
        duration: 3.5,
        ease: easeInOutSmooth,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    },
    settle: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      },
    },
    rest: {
      opacity: 0.6,
      scale: 0.9,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        ease: easeInOutSmooth,
      },
    },
  };

  // Glow animation variants
  const glowVariants: Variants = {
    hidden: { opacity: 0 },
    appear: {
      opacity: 0.8,
      transition: { duration: 0.6 },
    },
    wander: {
      opacity: [0.8, 1, 0.7, 1, 0.8],
      scale: [1, 1.3, 1.1, 1.4, 1],
      transition: {
        duration: 3.5,
        ease: easeInOutSmooth,
      },
    },
    settle: {
      opacity: 1,
      scale: [1, 1.5, 1],
      transition: {
        duration: 0.4,
        ease: easeOutSoft,
      },
    },
    rest: {
      opacity: 0.4,
      scale: 0.8,
      transition: {
        duration: 0.8,
      },
    },
  };

  // Enhanced particle trail variants - visible during all phases for comet effect
  const particleVariants: Variants = {
    hidden: { opacity: 0 },
    appear: { opacity: 0.4 },
    wander: {
      opacity: [0.4, 0.8, 0.6, 0.8, 0.5],
      transition: {
        duration: 3.5,
        ease: easeInOutSmooth,
      },
    },
    settle: {
      opacity: [0.8, 0.3],
      transition: { duration: 0.6 },
    },
    rest: { opacity: 0.2 },
  };

  // Inner core variants
  const coreVariants: Variants = {
    hidden: { opacity: 0 },
    appear: { opacity: 0.9 },
    wander: {
      opacity: [0.9, 1, 0.8, 1, 0.9],
      scale: [1, 1.1, 0.9, 1.1, 1],
      transition: {
        duration: 3.5,
        ease: easeInOutSmooth,
      },
    },
    settle: {
      opacity: 1,
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.4,
        ease: easeOutSoft,
      },
    },
    rest: { opacity: 0.5 },
  };

  // Main orb ball variants (scale/opacity only, no x/y since wrapper handles movement)
  const mainOrbVariants: Variants = {
    hidden: { opacity: 0, scale: 0.3 },
    appear: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: easeOutSoft } },
    wander: {
      opacity: 1,
      scale: [1, 1.15, 0.95, 1.1, 1.05, 1],
      transition: {
        duration: 3.5,
        ease: easeInOutSmooth,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    },
    settle: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
    rest: { opacity: 0.6, scale: 0.9, transition: { duration: 0.8, ease: easeInOutSmooth } },
  };

  return (
    <motion.div
      className="relative"
      style={{
        width: size,
        height: size,
      }}
      initial="appear"
      animate={phase}
      variants={orbVariants}
    >
      {/* Outer glow - enhanced intensity */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: size * 4,
          height: size * 4,
          left: -size * 1.5,
          top: -size * 1.5,
          background: 'radial-gradient(circle, hsl(30 100% 60% / 0.6) 0%, hsl(25 100% 55% / 0.3) 40%, transparent 70%)',
          filter: 'blur(8px)',
        }}
        variants={glowVariants}
        initial="appear"
        animate={phase}
      />

      {/* Additional intense inner glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: size * 2,
          height: size * 2,
          left: -size * 0.5,
          top: -size * 0.5,
          background: 'radial-gradient(circle, hsl(35 100% 65% / 0.8) 0%, hsl(30 100% 60% / 0.4) 50%, transparent 70%)',
          filter: 'blur(3px)',
        }}
        variants={glowVariants}
        initial="appear"
        animate={phase}
      />

      {/* Enhanced particle trail (18 particles creating a comet effect) */}
      {Array.from({ length: 18 }).map((_, i) => {
        const progress = i / 17; // 0 to 1
        const angle = -30 + progress * 60; // Arc from -30° to 30°
        const distance = size * (0.8 + progress * 2.5); // Spread out progressively
        const particleSize = size * (0.35 - progress * 0.25); // Shrink as they trail
        const hue = 25 + progress * 15; // Orange to yellow gradient
        const lightness = 65 - progress * 25; // Fade from bright to dim
        const opacity = 1 - progress * 0.7; // Fade opacity

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: particleSize,
              height: particleSize,
              background: `radial-gradient(circle, hsl(${hue} 100% ${lightness}%) 0%, hsl(${hue} 100% ${lightness - 10}%) 100%)`,
              left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * distance}px)`,
              top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * distance}px)`,
              transform: 'translate(-50%, -50%)',
              filter: `blur(${0.5 + progress * 1.5}px)`,
              boxShadow: `0 0 ${particleSize * 0.8}px hsl(${hue} 100% ${lightness}% / ${opacity * 0.6})`,
            }}
            variants={particleVariants}
            initial="appear"
            animate={phase}
          />
        );
      })}

      {/* Main orb - enhanced glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%,
            hsl(50 100% 75%) 0%,
            hsl(35 100% 60%) 30%,
            hsl(25 100% 50%) 60%,
            hsl(18 100% 40%) 100%
          )`,
          boxShadow: `
            0 0 ${size * 0.8}px hsl(35 100% 60% / 1),
            0 0 ${size * 1.2}px hsl(30 100% 55% / 0.8),
            0 0 ${size * 2}px hsl(25 100% 50% / 0.6),
            0 0 ${size * 3}px hsl(20 100% 45% / 0.4),
            inset 0 0 ${size * 0.4}px hsl(55 100% 85% / 0.7)
          `,
        }}
        variants={mainOrbVariants}
        initial="appear"
        animate={phase}
      />

      {/* Inner bright core - enhanced */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          left: size * 0.15,
          top: size * 0.1,
          background: 'radial-gradient(circle, hsl(55 100% 95%) 0%, hsl(45 100% 80%) 50%, hsl(35 100% 70%) 100%)',
          filter: 'blur(1px)',
          boxShadow: `0 0 ${size * 0.3}px hsl(55 100% 90% / 0.8)`,
        }}
        variants={coreVariants}
        initial="appear"
        animate={phase}
      />
    </motion.div>
  );
}

export const FireOrb = memo(FireOrbComponent);
