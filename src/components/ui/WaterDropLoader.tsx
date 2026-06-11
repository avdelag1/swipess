import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WaterDropLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  full?: boolean;
}

const sizeMap = {
  sm: { box: 32, wiggle: 0.04, bob: 3 },
  md: { box: 100, wiggle: 0.035, bob: 4 },
  lg: { box: 160, wiggle: 0.03, bob: 6 },
  full: { box: 120, wiggle: 0.035, bob: 4 },
};

const dropPath = 'M 50 8 C 50 8 90 40 90 64 C 90 86 72 96 50 96 C 28 96 10 86 10 64 C 10 40 50 8 50 8 Z';

export function WaterDropLoader({ size = 'md', full = false, className }: WaterDropLoaderProps) {
  const cfg = full ? sizeMap.full : sizeMap[size];
  const box = cfg.box;

  const content = (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <motion.svg
        viewBox="0 0 100 100"
        width={box}
        height={box}
        animate={{
          scaleY: [1, 1 - cfg.wiggle, 1, 1 + cfg.wiggle * 0.6, 1],
          y: [0, -cfg.bob, 0, cfg.bob * 0.4, 0],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.35, 0.95],
        }}
        style={{ originY: '50%' }}
      >
        <defs>
          <radialGradient id="drop-grad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#f8fafc" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#e2e8f0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.15" />
          </radialGradient>
          <linearGradient id="drop-shine" x1="25%" y1="15%" x2="55%" y2="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="drop-shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.15" />
          </filter>
          <filter id="drop-glow">
            <feGaussianBlur stdDeviation="8" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '50%', originY: '50%' }}
        >
          <path d={dropPath} fill="url(#drop-grad)" filter="url(#drop-shadow)" />

          <path
            d={dropPath}
            fill="url(#drop-shine)"
            filter="url(#drop-glow)"
            opacity={0.6}
          />

          <motion.path
            d="M 34 24 C 38 20 44 19 48 22 C 46 26 40 28 36 27 C 34 26 33 25 34 24 Z"
            fill="#ffffff"
            opacity={0.8}
            animate={{ opacity: [0.8, 0.3, 0.8] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>
      </motion.svg>
    </div>
  );

  if (full) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black">
        {content}
      </div>
    );
  }

  return content;
}
