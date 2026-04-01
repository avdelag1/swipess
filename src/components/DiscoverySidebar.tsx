import { memo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, MessageCircle, Share2, Info, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface DiscoverySidebarProps {
  onUndo?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  onInsights?: () => void;
  onSpeedMeet?: () => void;
  canUndo?: boolean;
  matchPercentage?: number;
}

const SIDEBAR_SPRING = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };

export const DiscoverySidebar = memo(({
  onUndo,
  onMessage,
  onShare,
  onInsights,
  onSpeedMeet,
  canUndo = false,
  matchPercentage = 0,
}: DiscoverySidebarProps) => {
  
  const handleAction = (cb?: () => void, haptic: 'light' | 'medium' | 'success' = 'light') => {
    if (!cb) return;
    triggerHaptic(haptic);
    cb();
  };

  const ActionIcon = ({ 
    icon: Icon, 
    onClick, 
    label, 
    colorClass = "text-white", 
    glowColor = "rgba(255,255,255,0.2)",
    disabled = false
  }: any) => (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => handleAction(onClick)}
      disabled={disabled}
      className={cn(
        "group relative w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all",
        "bg-black/40 backdrop-blur-md border border-white/10",
        disabled ? "opacity-30 grayscale cursor-not-allowed" : "hover:bg-white/10 active:bg-white/20"
      )}
    >
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity blur-md"
        style={{ backgroundColor: glowColor }}
      />
      <Icon className={cn("w-6 h-6 relative z-10", colorClass)} strokeWidth={2.2} />
      <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </motion.button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SIDEBAR_SPRING}
      className="absolute right-4 bottom-40 z-50 flex flex-col items-center gap-4 py-4"
    >
      {/* MATCH METER — Sentient Connection */}
      {matchPercentage > 0 && (
        <motion.div 
          className="w-12 h-12 rounded-full border-2 border-brand-accent-2 flex items-center justify-center bg-black/60 backdrop-blur-md mb-2 shadow-[0_0_15px_rgba(255,107,53,0.4)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] font-black text-brand-accent-2">{matchPercentage}%</span>
        </motion.div>
      )}

      {/* ACTION STACK */}
      <div className="flex flex-col gap-3">
        <ActionIcon 
          icon={RotateCcw} 
          onClick={onUndo} 
          label="Return" 
          colorClass="text-amber-400" 
          glowColor="rgba(245,158,11,0.3)"
          disabled={!canUndo} 
        />
        
        <ActionIcon 
          icon={MessageCircle} 
          onClick={onMessage} 
          label="Chat" 
          colorClass="text-cyan-400" 
          glowColor="rgba(6,182,212,0.3)" 
        />
        
        <ActionIcon 
          icon={Share2} 
          onClick={onShare} 
          label="Share" 
          colorClass="text-purple-400" 
          glowColor="rgba(168,85,247,0.3)" 
        />
        
        <ActionIcon 
          icon={Info} 
          onClick={onInsights} 
          label="Insights" 
          colorClass="text-white/80" 
          glowColor="rgba(255,255,255,0.2)" 
        />

        {onSpeedMeet && (
          <ActionIcon 
            icon={Sparkles} 
            onClick={onSpeedMeet} 
            label="AI Meet" 
            colorClass="text-yellow-400" 
            glowColor="rgba(255,215,0,0.3)" 
          />
        )}
      </div>
    </motion.div>
  );
});
