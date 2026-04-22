import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

export default function DiscoveryMapLoading({ isLight = false }: { isLight?: boolean }) {
  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center p-10 relative overflow-hidden",
      isLight ? "bg-white" : "bg-black"
    )}>
      {/* 🛸 Swipess Atmospheric Glow */}
      {!isLight && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full animate-pulse" />
        </div>
      )}

      {/* 📡 Radar Animation */}
      <div className="relative w-64 h-64 mb-10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 0.5, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut"
            }}
            className={cn(
              "absolute inset-0 rounded-full border",
              isLight ? "border-slate-200" : "border-primary/30"
            )}
          />
        ))}
        
        <div className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full border backdrop-blur-sm",
          isLight ? "bg-white/50 border-slate-200" : "bg-black/50 border-white/10"
        )}>
          <Zap className={cn("w-12 h-12 animate-pulse", isLight ? "text-slate-300" : "text-primary/50")} />
        </div>
      </div>

      <div className="text-center z-10">
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-xl font-black italic tracking-tighter uppercase mb-2",
            isLight ? "text-slate-900" : "text-white"
          )}
        >
          Initializing Radar
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.3em] italic",
            isLight ? "text-slate-400" : "text-primary/60"
          )}
        >
          Synchronizing Discovery Uplink...
        </motion.p>
      </div>
    </div>
  );
}
