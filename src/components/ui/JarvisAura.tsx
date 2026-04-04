import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface JarvisAuraProps {
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 🤖 THE JARVIS AURA
 * An organic, pulsating sentient orb that represents the AI's presence.
 * It shifts its glow intensity, shape, and pulse rate based on its state.
 */
export function JarvisAura({ isThinking = false, size = 'md', className }: JarvisAuraProps) {
  const [_pulseScale, _setPulseScale] = useState(1);
  const controls = useAnimation();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  useEffect(() => {
    if (isThinking) {
      controls.start({
        scale: [1, 1.2, 0.9, 1.1, 1],
        rotate: [0, 90, 180, 270, 360],
        transition: { 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }
      });
    } else {
      controls.start({
        scale: [1, 1.05, 1],
        rotate: 0,
        transition: { 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }
      });
    }
  }, [isThinking, controls]);

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      {/* Outer Glow 1 */}
      <motion.div
        animate={controls}
        className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl"
      />
      
      {/* Outer Glow 2 */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-red-400/10 rounded-full blur-3xl"
      />

      {/* The Core Orb */}
      <motion.div
        animate={controls}
        className={cn(
          "relative z-10 w-full h-full rounded-full border border-white/20 backdrop-blur-md overflow-hidden",
          "bg-gradient-to-br from-orange-400/30 via-rose-500/20 to-purple-600/30 shadow-inner"
        )}
      >
        {/* Internal Pulsing Particles */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-white/20 rounded-full blur-md"
        />
        
        {/* Core Light */}
        <div className="absolute inset-x-2 inset-y-2 bg-white/10 rounded-full blur-sm" />
      </motion.div>

      {/* Decorative Rotating Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-10%] border border-dotted border-orange-400/30 rounded-full"
      />
    </div>
  );
}
