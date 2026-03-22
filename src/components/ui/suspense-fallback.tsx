import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PremiumLoader } from '../PremiumLoader';

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
        <PremiumLoader />
      )}
    </div>
  );
}

export default SuspenseFallback;
