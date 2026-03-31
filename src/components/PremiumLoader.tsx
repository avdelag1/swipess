import { motion } from 'framer-motion';
import { SwipessLogo } from './SwipessLogo';
import { cn } from '@/lib/utils';

interface PremiumLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
}

export function PremiumLoader({ className, size = 'md', full = false }: PremiumLoaderProps) {
  const logoSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6", 
      full ? "fixed inset-0 z-[99999] bg-black" : "",
      className
    )}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <SwipessLogo size={logoSize} />
      </motion.div>
      
      {/* The "Red Bar" linear progress indicator */}
      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
        <motion.div 
          className="absolute inset-0 bg-brand-primary"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #ff1f1f 50%, transparent 100%)',
            boxShadow: '0 0 15px rgba(255, 31, 31, 0.5)'
          }}
        />
      </div>
    </div>
  );
}
