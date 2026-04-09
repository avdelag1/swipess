import { motion } from 'framer-motion';
import { SwipessLogo } from './SwipessLogo';
import { cn } from '@/lib/utils';

interface PremiumLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
}

/**
 * Clean loader — just the SwipesS wordmark, breathing.
 * Matches the landing page and splash screen feel.
 */
export function PremiumLoader({ className, size = 'md', full = false }: PremiumLoaderProps) {
  const logoSize = size === 'sm' ? 'lg' : size === 'lg' ? '4xl' : '2xl';

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      full ? "fixed inset-0 z-[99999] bg-black" : "",
      className
    )}>
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <SwipessLogo size={logoSize} />
      </motion.div>
    </div>
  );
}
