import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles } from 'lucide-react';
import { useModalStore } from '@/state/modalStore';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useLocation } from 'react-router-dom';

export function VoiceConciergeButton() {
  const { isLight } = useAppTheme();
  const location = useLocation();
  const { setModal, showAIChat } = useModalStore();

  const isDashboard = location.pathname.includes('/dashboard');
  const isExplore = location.pathname.includes('/explore');
  
  if (!isDashboard && !isExplore) return null;
  if (showAIChat) return null;

  const handleOpen = () => {
    triggerHaptic('heavy');
    setModal('showAIChat', true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, x: -20 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0, opacity: 0, x: -20 }}
        className="fixed left-4 z-[200]"
        style={{ bottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px) + 12px)' }}
      >
        <button
          onClick={handleOpen}
          className={cn(
            "group relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all active:scale-90",
            isLight 
              ? "bg-white border border-slate-200 text-slate-900" 
              : "bg-black/80 border border-white/10 text-white"
          )}
        >
          {/* Nexus Glow Aura */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse group-hover:bg-cyan-500/40 transition-colors" />
          
          <div className="relative z-10 flex items-center justify-center">
            <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-cyan-400 animate-bounce" />
          </div>

          {/* Tooltip-like label on hover */}
          <div className="absolute left-full ml-4 px-4 py-2 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Voice Assistant</span>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
