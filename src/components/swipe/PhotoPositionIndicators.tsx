import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PhotoPositionIndicatorsProps {
  count: number;
  currentIndex: number;
  hidden?: boolean;
  className?: string;
}

export function PhotoPositionIndicators({ count, currentIndex, hidden = false, className }: PhotoPositionIndicatorsProps) {
  if (count <= 0) return null;

  return (
    <div
      className={cn(
        'absolute inset-x-0 top-[calc(var(--safe-top,0px)+68px)] z-[46] flex justify-center pointer-events-none transition-opacity duration-200',
        className,
      )}
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: count }).map((_, idx) => {
          const active = idx === currentIndex;
          return (
            <motion.span
              key={idx}
              className="block h-1.5 rounded-full bg-foreground"
              animate={{ width: active ? 22 : 6, scale: active ? 1 : 0.82, opacity: active ? 1 : 0.42 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                boxShadow: active
                  ? '0 0 10px hsl(var(--foreground) / 0.62), 0 1px 3px rgba(0,0,0,0.6)'
                  : '0 1px 3px rgba(0,0,0,0.55)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}