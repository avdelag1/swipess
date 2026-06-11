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
  const orbSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6",
      full ? "fixed inset-0 z-[99999] bg-background/80 backdrop-blur-md" : "",
      className
    )}>
      <SwipessLogo size={logoSize} variant="gradient" />
      
      {/* Elastic, Flowing, Glowing Orb Loader */}
      <div className={cn("relative flex items-center justify-center", orbSize)}>
        {/* Core glowing orb */}
        <motion.div
          animate={{ 
            scale: [1, 1.25, 0.9, 1.15, 1],
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ["50%", "40% 60% 50% 40%", "45% 55% 40% 60%", "60% 40% 55% 45%", "50%"]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={cn(
            "absolute inset-0 bg-gradient-to-tr from-[#FF4D00] via-[#EB4898] to-[#9D4EDD] opacity-80 blur-[2px]",
          )}
          style={{
            boxShadow: '0 0 25px 8px rgba(235, 72, 152, 0.4)'
          }}
        />
        
        {/* Inner core for depth */}
        <motion.div
          animate={{ 
            scale: [0.8, 1.1, 0.85, 1.05, 0.8],
            rotate: [360, 270, 180, 90, 0],
            borderRadius: ["50%", "60% 40% 55% 45%", "45% 55% 40% 60%", "40% 60% 50% 40%", "50%"]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-2 bg-white/30 backdrop-blur-sm"
        />
      </div>
    </div>
  );
}
