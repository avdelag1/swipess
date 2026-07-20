import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { LucideIcon } from 'lucide-react';

export type EmptyStateVariant = 'messages' | 'likes' | 'search' | 'notifications' | 'generic';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Accent color class for icon glow — defaults to brand-accent-2 */
  accentClass?: string;
  /** Illustration variant — drives the animated SVG shown */
  variant?: EmptyStateVariant;
}

/* ── Animated SVG Illustrations ────────────────────────────────────────── */

const MessagesBubbles = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
    {/* Large bubble */}
    <motion.rect
      x="16" y="30" width="56" height="38" rx="19"
      fill="currentColor" opacity={0.12}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.12 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
    />
    {/* Lines inside */}
    <motion.rect x="28" y="43" width="32" height="3" rx="1.5" fill="currentColor" opacity={0.18}
      initial={{ width: 0 }} animate={{ width: 32 }} transition={{ delay: 0.3, duration: 0.4 }} />
    <motion.rect x="28" y="50" width="20" height="3" rx="1.5" fill="currentColor" opacity={0.12}
      initial={{ width: 0 }} animate={{ width: 20 }} transition={{ delay: 0.4, duration: 0.4 }} />
    {/* Small bubble */}
    <motion.rect
      x="52" y="60" width="48" height="30" rx="15"
      fill="currentColor" opacity={0.08}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.08 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
    />
    <motion.rect x="62" y="71" width="28" height="3" rx="1.5" fill="currentColor" opacity={0.14}
      initial={{ width: 0 }} animate={{ width: 28 }} transition={{ delay: 0.5, duration: 0.4 }} />
    {/* Floating dots */}
    {[0, 1, 2].map((i) => (
      <motion.circle
        key={i} cx={34 + i * 8} cy={48} r={2}
        fill="currentColor" opacity={0.2}
        animate={{ y: [-1, 1, -1] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
      />
    ))}
  </svg>
);

const LikesHeart = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
    <motion.path
      d="M60 95 C30 70, 10 50, 25 35 C35 25, 50 30, 60 45 C70 30, 85 25, 95 35 C110 50, 90 70, 60 95Z"
      fill="currentColor" opacity={0.1}
      stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.2}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [1, 1.06, 1], opacity: [0.1, 0.15, 0.1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '50% 55%' }}
    />
    {/* Sparkles */}
    {[[30, 28], [90, 28], [60, 18], [42, 72], [78, 72]].map(([cx, cy], i) => (
      <motion.circle
        key={i} cx={cx} cy={cy} r={1.5}
        fill="currentColor" opacity={0}
        animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
      />
    ))}
  </svg>
);

const SearchGlass = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
    <motion.circle
      cx="52" cy="52" r="26"
      stroke="currentColor" strokeWidth={2.5} strokeOpacity={0.2}
      fill="currentColor" fillOpacity={0.05}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    />
    <motion.line
      x1="72" y1="72" x2="96" y2="96"
      stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeOpacity={0.2}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    />
    {/* Scanning pulse */}
    <motion.circle
      cx="52" cy="52" r="26"
      stroke="currentColor" strokeWidth={1} fill="none"
      initial={{ scale: 1, opacity: 0.3 }}
      animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
    />
  </svg>
);

const GenericStars = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
    {[
      { cx: 60, cy: 50, r: 4, delay: 0 },
      { cx: 35, cy: 65, r: 2.5, delay: 0.3 },
      { cx: 85, cy: 40, r: 3, delay: 0.6 },
      { cx: 45, cy: 35, r: 2, delay: 0.9 },
      { cx: 75, cy: 70, r: 2.5, delay: 1.2 },
    ].map((star, i) => (
      <motion.circle
        key={i} cx={star.cx} cy={star.cy} r={star.r}
        fill="currentColor"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0.1, 0.35, 0.1], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
      />
    ))}
    {/* Orbital ring */}
    <motion.circle
      cx="60" cy="55" r="30"
      stroke="currentColor" strokeWidth={0.8} strokeDasharray="4 6" fill="none" strokeOpacity={0.1}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: '60px 55px' }}
    />
  </svg>
);

const ILLUSTRATIONS: Record<EmptyStateVariant, React.FC> = {
  messages: MessagesBubbles,
  likes: LikesHeart,
  search: SearchGlass,
  notifications: GenericStars,
  generic: GenericStars,
};

/**
 * Premium branded empty state with animated illustration, subtle glow, and optional CTA.
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
  variant = 'generic',
}: EmptyStateProps) {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const Illustration = ILLUSTRATIONS[variant];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn(
        'flex flex-col items-center justify-center py-20 px-6 text-center rounded-[3rem] border border-dashed relative overflow-hidden',
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

      {/* Animated SVG Illustration */}
      <div className={cn('relative w-32 h-32 mb-4', accentClass)}>
        <Illustration />
      </div>

      {/* Icon container with breathing animation */}
      <div className="relative mb-6">
        <div
          className={cn(
            'w-16 h-16 rounded-[1.2rem] flex items-center justify-center border',
            isLight
              ? 'bg-card border-border/40 shadow-lg'
              : 'bg-white/[0.04] border-white/[0.08]'
          )}
        >
          <Icon className={cn('w-7 h-7 opacity-70', accentClass)} strokeWidth={1.5} />
        </div>
        {/* Pulse ring */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-[1.2rem] border-2',
            isLight ? 'border-primary/10' : 'border-white/[0.06]'
          )}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <h3 className="text-xl font-black text-foreground tracking-tight mb-2 relative z-10">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground/70 max-w-[280px] leading-relaxed relative z-10">
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
