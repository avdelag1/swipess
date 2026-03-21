import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  return (
    <div
      className={cn(
        'h-full w-full flex-1 flex items-center justify-center bg-background',
        className
      )}
      aria-hidden="true"
    >
      {!minimal && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 relative">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{ borderTopColor: 'hsl(var(--primary))', borderRightColor: 'hsl(var(--primary)/0.3)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SuspenseFallback;
