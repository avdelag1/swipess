import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Eye, Share2, Flag } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

interface SwipeActionButtonBarProps {
  onMessage?: () => void;
  onInsights?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  className?: string;
  // Legacy / unused — kept for call-site compat
  onSpeedMeet?: () => void;
  onCycleCategory?: () => void;
}

// Apple-style ghost button — white icon, no frame, soft shadow only
const GhostButton = memo(function GhostButton({
  icon: Icon,
  onClick,
  disabled,
  ariaLabel,
  index,
  size = 22,
}: {
  icon: React.ElementType;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
  index: number;
  size?: number;
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || !onClick) return;
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic('light');
    onClick();
  }, [disabled, onClick]);

  if (!onClick) return null;

  return (
    <motion.button
      onClick={handleClick}
      aria-label={ariaLabel}
      type="button"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 24,
        delay: index * 0.04,
      }}
      whileTap={{ scale: 0.82, transition: { type: 'spring', stiffness: 600, damping: 18 } }}
      disabled={disabled}
      style={{
        width: size + 16,
        height: size + 16,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
      }}
    >
      <Icon
        size={size}
        strokeWidth={2}
        style={{
          color: '#FFFFFF',
          // Layered shadows: depth shadow + subtle white glow
          filter:
            'drop-shadow(0 1px 3px rgba(0,0,0,0.7)) drop-shadow(0 3px 10px rgba(0,0,0,0.45)) drop-shadow(0 0 8px rgba(255,255,255,0.12))',
        }}
      />
    </motion.button>
  );
});

export const SwipeActionButtonBar = memo(function SwipeActionButtonBar({
  onMessage,
  onInsights,
  onShare,
  onReport,
  onLike,
  onDislike,
  onUndo,
  canUndo = false,
  disabled = false,
  className = '',
}: SwipeActionButtonBarProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 pointer-events-auto ${className}`}
      style={{ userSelect: 'none' }}
    >
      {onMessage && (
        <GhostButton icon={MessageCircle} onClick={onMessage} disabled={disabled} ariaLabel="Message" index={0} />
      )}
      {onInsights && (
        <GhostButton icon={Eye} onClick={onInsights} disabled={disabled} ariaLabel="Insights" index={1} />
      )}
      {onShare && (
        <GhostButton icon={Share2} onClick={onShare} disabled={disabled} ariaLabel="Share" index={2} />
      )}
      {onReport && (
        <GhostButton icon={Flag} onClick={onReport} disabled={disabled} ariaLabel="Report" index={3} />
      )}
    </div>
  );
});

SwipeActionButtonBar.displayName = 'SwipeActionButtonBar';
