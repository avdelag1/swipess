import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface ConnectingOverlayProps {
  isOpen: boolean;
  recipientName?: string;
  statusText?: string;
}

export function ConnectingOverlay({ 
  isOpen, 
  recipientName = 'Resident',
  statusText = 'Establishing secure connection...'
}: ConnectingOverlayProps) {
  const { isLight } = useAppTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-xl"
        >
          {/* 🛸 SWIPES ATMOSPHERE */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
                x: [-100, 100, -100],
                y: [-100, 100, -100]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-[150%] h-[150%] bg-rose-500/20 rounded-full blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.1, 0.2, 0.1],
                x: [100, -100, 100],
                y: [100, -100, 100]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/4 w-[150%] h-[150%] bg-violet-600/20 rounded-full blur-[120px]" 
            />
          </div>

          <div className="relative flex flex-col items-center gap-12 max-w-xs text-center">
            {/* CENTRAL ANIMATION */}
            <div className="relative">
              {/* Outer Pulse Rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 2.5], opacity: [0.6, 0] }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    delay: i * 0.8,
                    ease: "easeOut" 
                  }}
                  className="absolute inset-0 rounded-full border border-primary/40 bg-primary/5"
                />
              ))}

              {/* Holographic Core */}
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  rotateY: { duration: 6, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className={cn(
                  "relative w-32 h-32 rounded-[2.5rem] border-2 flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] bg-gradient-to-br",
                  isLight ? "from-white to-slate-100 border-primary/20" : "from-zinc-900 to-black border-primary/30"
                )}
              >
                <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-[2.5rem]" />
                <MessageCircle className="w-12 h-12 text-primary" strokeWidth={1.5} />
                
                {/* Orbital Sparkles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4"
                >
                  <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 text-amber-400" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-8"
                >
                  <Zap className="absolute bottom-0 right-1/2 translate-x-1/2 w-4 h-4 text-blue-400" />
                </motion.div>
              </motion.div>
            </div>

            {/* TEXT CONTENT */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                  Connecting
                </h2>
                <p className="text-sm font-bold text-primary tracking-widest uppercase opacity-80">
                  {recipientName}
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  {statusText}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
