import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Accent color class for icon glow — defaults to brand-accent-2 */
  accentClass?: string;
}

/**
 * Premium branded empty state with animated icon, subtle glow, and optional CTA.
 * Designed to feel cinematic and luxurious — never "broken" or "beta".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  accentClass = 'text-[var(--color-brand-accent-2)]',
}: EmptyStateProps) {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn(
        'flex flex-col items-center justify-center py-24 px-6 text-center rounded-[3rem] border border-dashed relative overflow-hidden',
        isLight
          ? 'bg-primary/[0.02] border-border/40'
          : 'bg-white/[0.02] border-white/[0.06]',
        className
      )}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: isLight
            ? 'radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.08), transparent 70%)'
            : 'radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.12), transparent 70%)',
        }}
      />

      {/* Icon container with breathing animation */}
      <div className="relative mb-8">
        <div
          className={cn(
            'w-24 h-24 rounded-[2rem] flex items-center justify-center border',
            isLight
              ? 'bg-card border-border/40 shadow-lg'
              : 'bg-white/[0.04] border-white/[0.08]'
          )}
        >
          <Icon className={cn('w-10 h-10 opacity-40', accentClass)} strokeWidth={1.5} />
        </div>
        {/* Pulse ring */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-[2rem] border-2',
            isLight ? 'border-primary/10' : 'border-white/[0.06]'
          )}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <h3 className="text-xl font-black text-foreground tracking-tight mb-2 relative z-10">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground/70 max-w-[260px] leading-relaxed relative z-10">
        {description}
      </p>

      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className={cn(
            'mt-8 px-8 py-4 rounded-2xl text-sm font-black tracking-widest transition-all relative z-10',
            'bg-[var(--color-brand-accent-2)] text-white',
            'shadow-[0_10px_30px_rgba(228,0,124,0.3)]',
            'hover:shadow-[0_14px_40px_rgba(228,0,124,0.4)]',
            'active:scale-95'
          )}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}


