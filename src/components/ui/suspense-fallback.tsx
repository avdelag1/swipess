import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  if (minimal) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-orange-500"
        />
      </div>
    );
  }

  return (
    <div className={cn("fixed inset-0 z-[999] flex items-center justify-center bg-[#050505]", className)}>
      {/* Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Loading Orb */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 rounded-3xl relative overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f97316, #ec4899)',
            boxShadow: '0 0 40px rgba(249, 115, 22, 0.3)'
          }}
        >
          <div className="absolute inset-[1px] bg-black/20 rounded-[22px] backdrop-blur-sm" />
          <motion.div
            animate={{ x: [-20, 20, -20] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-8 h-8 rounded-full bg-white/20 blur-md"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase"
        >
          Connecting
        </motion.p>
      </div>
    </div>
  );
}

export default SuspenseFallback;
