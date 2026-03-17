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
        minimal ? 'p-2' : 'min-h-screen min-h-dvh flex flex-col items-center justify-center bg-background',
        className
      )}
      aria-hidden="true"
    >
      {!minimal && (
        <div className="relative flex flex-col items-center gap-6">
          {/* Logo container with pulse */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: [0.9, 1.05, 1],
              opacity: 1
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 relative z-10"
          >
            <img 
              src="/icons/fire-s-logo.png" 
              alt="Loading..." 
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            />
          </motion.div>
          
          {/* Loading bar */}
          <div className="w-32 h-1 bg-foreground/5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute inset-y-0 bg-gradient-to-r from-rose-500 to-orange-500"
              initial={{ left: "-100%", width: "50%" }}
              animate={{ left: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40"
          >
            Preparing Experience
          </motion.p>
        </div>
      )}
    </div>
  );
}

export default SuspenseFallback;
