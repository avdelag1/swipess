import { motion } from 'framer-motion';
import { SwipessLogo } from './SwipessLogo';
import { cn } from '@/lib/utils';

interface PremiumLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
}

export function PremiumLoader({ className, size = 'md', full = false }: PremiumLoaderProps) {
  const logoSize = size === 'sm' ? 'md' : size === 'lg' ? '3xl' : 'xl';
  const spinnerSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6",
      full ? "fixed inset-0 z-[99999] bg-black" : "",
      className
    )}>
      <SwipessLogo size={logoSize} variant="gradient" />
      <div className={cn("relative", spinnerSize)}>
        <div className={cn("rounded-full border-2 border-white/10", spinnerSize)} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent border-t-white/70",
            spinnerSize
          )}
        />
      </div>
    </div>
  );
}
