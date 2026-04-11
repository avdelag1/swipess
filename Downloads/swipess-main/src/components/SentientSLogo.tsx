import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

interface SentientSLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

const heightMap = {
  xs: 'h-6 w-6',
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
  '2xl': 'h-28 w-28',
  '3xl': 'h-36 w-36',
  '4xl': 'h-48 w-48',
};

const sounds = {
  laugh: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_996c94bc20.mp3?filename=baby-laughing-99572.mp3', // Baby laugh or similar
  whistle: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2d6b38c350.mp3?filename=whistle-fast-89269.mp3',
  boing: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_e65ef63831.mp3?filename=boing-629.mp3'
};

const playSound = (type: keyof typeof sounds) => {
  const audio = new Audio(sounds[type]);
  audio.volume = 0.3;
  audio.play().catch(() => { /* mute if blocked */ });
};

export const SentientSLogo = memo(({ size = 'md', className }: SentientSLogoProps) => {
  const [mood, setMood] = useState<'normal' | 'happy' | 'winking' | 'shocked' | 'cool'>('normal');
  const [_isJumping, setIsJumping] = useState(false);
  const controls = useAnimation();

  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Visibility Tracking ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Sentient Random Movements ───────────────────────────────────────
  useEffect(() => {
    if (!isVisible) return;
    const aliveLoop = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.2) {
        // Random blink/wiggle
        controls.start({
          rotate: [0, -10, 10, 0],
          transition: { duration: 0.5, ease: "easeInOut" }
        });
      } else if (rand < 0.05) {
          // Rare big jump
          setIsJumping(true);
          controls.start({
            y: [0, -40, 0],
            scale: [1, 1.2, 0.9, 1],
            transition: { duration: 0.8, ease: "backOut" }
          }).then(() => setIsJumping(false));
      }
    }, 4000);

    return () => clearInterval(aliveLoop);
  }, [controls, isVisible]);

  // ── Sentient-Sync: React to global stars ─────────────────────────────
  useEffect(() => {
    const handleStar = () => {
      setMood('shocked');
      setTimeout(() => setMood('normal'), 1200);
    };
    window.addEventListener('STAR_SPAWNED', handleStar as EventListener);
    return () => window.removeEventListener('STAR_SPAWNED', handleStar as EventListener);
  }, []);

  // ── Interaction Logic ───────────────────────────────────────────────
  const handleTap = useCallback(() => {
    triggerHaptic('heavy');
    const moods: typeof mood[] = ['happy', 'winking', 'shocked', 'cool'];
    const nextMood = moods[Math.floor(Math.random() * moods.length)];
    setMood(nextMood);
    controls.start({
      scale: [1, 1.3, 0.8, 1.1, 1],
      rotate: [0, -15, 15, -10, 0],
      transition: { duration: 0.6 }
    });
    if (nextMood === 'happy') playSound('laugh');
    if (nextMood === 'winking') playSound('whistle');
    if (nextMood === 'shocked') playSound('boing');
    setTimeout(() => setMood('normal'), 2000);
  }, [controls]);

  // ── 3D Tilt Logic ───────────────────────────────────────────────────
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    setTilt({ x: px * 15, y: py * -15 });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={containerRef}
      onClick={handleTap}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseLeave={resetTilt}
      onTouchEnd={resetTilt}
      animate={{
        ...(isVisible ? controls : {}),
        rotateY: tilt.x,
        rotateX: tilt.y,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'relative cursor-pointer select-none group flex items-center justify-center',
        heightMap[size],
        className
      )}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* The Central S Logo */}
      <img
        src="/icons/swipess-logo-transparent.png"
        alt="S"
        width="960"
        height="640"
        className="w-full h-full object-contain relative z-10 scale-125"
      />

      {/* The Sentient Face Controls */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center pt-2">
         {/* Eyes Wrapper - unified for zero-mount performance */}
         <div className="flex gap-2.5 mb-1.5 translate-y-2">
            <Eye mood={mood} side="left" />
            <Eye mood={mood} side="right" />
         </div>

         {/* Mouth Wrapper - unified for zero-mount performance */}
         <div className="h-4 translate-y-1">
            <Mouth mood={mood} />
         </div>
      </div>
    </motion.div>
  );
});

// ── Little Parts ─────────────────────────────────────────────────────────────

const Eye = ({ mood, side }: { mood: string, side: 'left' | 'right' }) => {
  const type = mood === 'winking' && side === 'right' ? 'closed' : 
               mood === 'shocked' ? 'shocked' : 
               mood === 'cool' ? 'cool' : 'normal';

  return (
    <div
      className={cn(
        "w-2.5 h-2.5 bg-white rounded-full shadow-lg border-b-2 border-rose-900/40 relative overflow-hidden transition-all duration-200",
        type === 'cool' && "bg-black"
      )}
    >
      {type === 'normal' && <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-black rounded-full" />}
      {type === 'closed' && (
         <div className="absolute inset-0 bg-rose-500/80 flex items-center justify-center">
           <div className="w-full h-0.5 bg-rose-900/50" />
         </div>
      )}
      {type === 'shocked' && <div className="absolute inset-0 flex items-center justify-center font-black text-[6px] text-black">!</div>}
      {type === 'cool' && (
        <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2" />
      )}
    </div>
  );
};

const Mouth = ({ mood }: { mood: string }) => {
  const type = (mood === 'happy' || mood === 'winking') ? 'happy' : 
               mood === 'shocked' ? 'shocked' : 
               mood === 'cool' ? 'cool' : 'normal';

  return (
    <div className="flex items-center justify-center transition-all duration-200">
      {type === 'normal' && <div className="w-2.5 h-0.5 bg-rose-900/80 rounded-full" />}
      {type === 'happy' && (
        <div className="w-3.5 h-2.5 border-b-2 border-rose-900/80 rounded-full bg-rose-100/20" />
      )}
      {type === 'shocked' && (
        <div className="w-2 h-2 rounded-full border border-rose-900/80 bg-rose-900/10" />
      )}
      {type === 'cool' && (
        <div className="w-3 h-0.5 bg-black rotate-[-5deg] shadow-sm" />
      )}
    </div>
  );
};
