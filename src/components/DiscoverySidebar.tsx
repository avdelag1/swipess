import { memo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, MessageCircle, Share2, Info, Sparkles, Flame, ThumbsDown, Flag } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface DiscoverySidebarProps {
  onUndo?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  onInsights?: () => void;
  onSpeedMeet?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onReport?: () => void;
  canUndo?: boolean;
  matchPercentage?: number;
}

const SIDEBAR_SPRING = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 };

export const DiscoverySidebar = memo(({
  onUndo,
  onMessage,
  onShare,
  onInsights,
  onSpeedMeet,
  onLike,
  onDislike,
  onReport,
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
    disabled = false,
    size = 'default' as 'default' | 'large'
  }: any) => (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onTapStart={(e) => {
        // Stop the event from reaching the card's drag system
        if (e && 'stopPropagation' in e) (e as any).stopPropagation();
      }}
      onTap={(e) => {
        if (e && 'stopPropagation' in e) (e as any).stopPropagation();
        handleAction(onClick);
      }}
      onPointerDownCapture={(e: React.PointerEvent) => {
        e.stopPropagation();
      }}
      disabled={disabled}
      style={{ touchAction: 'manipulation' }}
      className={cn(
        "group relative rounded-2xl flex flex-col items-center justify-center transition-all pointer-events-auto",
        "bg-black/40 backdrop-blur-md border border-white/10",
        disabled ? "opacity-30 grayscale cursor-not-allowed" : "hover:bg-white/10 active:bg-white/20",
        size === 'large' ? "w-14 h-14" : "w-12 h-12"
      )}
    >
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity blur-md"
        style={{ backgroundColor: glowColor }}
      />
      <Icon className={cn("relative z-10", colorClass, size === 'large' ? "w-7 h-7" : "w-6 h-6")} strokeWidth={1.5} />
    </motion.button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SIDEBAR_SPRING}
      className="absolute right-3 bottom-36 z-50 flex flex-col items-center gap-3 py-3"
    >
      {/* MATCH METER */}
      {matchPercentage > 0 && (
        <motion.div 
          className="w-12 h-12 rounded-full border-2 border-brand-accent-2 flex items-center justify-center bg-black/60 backdrop-blur-md mb-1 shadow-[0_0_15px_rgba(255,107,53,0.4)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] font-black text-brand-accent-2">{matchPercentage}%</span>
        </motion.div>
      )}

      {/* ACTION STACK */}
      <div className="flex flex-col gap-2.5">
        <ActionIcon 
          icon={RotateCcw} 
          onClick={onUndo} 
          label="Undo" 
          colorClass="text-amber-400" 
          glowColor="rgba(245,158,11,0.3)"
          disabled={!canUndo} 
        />

        {onDislike && (
          <ActionIcon 
            icon={ThumbsDown} 
            onClick={onDislike} 
            label="Pass" 
            colorClass="text-red-400" 
            glowColor="rgba(239,68,68,0.3)"
            size="large"
          />
        )}

        {onLike && (
          <ActionIcon 
            icon={Flame} 
            onClick={onLike} 
            label="Like" 
            colorClass="text-orange-400" 
            glowColor="rgba(251,146,60,0.4)"
            size="large"
          />
        )}
        
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
          label="Info" 
          colorClass="text-white/80" 
          glowColor="rgba(255,255,255,0.2)" 
        />

        <ActionIcon 
          icon={Flag} 
          onClick={onReport} 
          label="Report" 
          colorClass="text-red-500/80" 
          glowColor="rgba(239,68,68,0.2)" 
        />

        {onSpeedMeet && (
          <ActionIcon 
            icon={Sparkles} 
            onClick={onSpeedMeet} 
            label="AI" 
            colorClass="text-yellow-400" 
            glowColor="rgba(255,215,0,0.3)" 
          />
        )}
      </div>
    </motion.div>
  );
});


