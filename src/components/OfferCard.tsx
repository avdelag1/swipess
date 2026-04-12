/**
 * OFFER CARD — Promotional banner component
 * 
 * Displays time-sensitive deals, promotions, or informational cards.
 * Can show a video or image with a CTA that links to a dedicated page.
 * Dismissible and remembers dismissal state.
 */

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, Gift, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfferCardProps {
  id: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaPath?: string;
  icon?: 'sparkles' | 'gift' | 'zap';
  gradient?: string;
  dismissible?: boolean;
  showOnce?: boolean;
  onAction?: () => void;
  className?: string;
}

const ICONS = {
  sparkles: Sparkles,
  gift: Gift,
  zap: Zap,
};

export const OfferCard = memo(({
  id,
  title,
  description,
  ctaText = 'Learn More',
  icon = 'sparkles',
  gradient = 'from-orange-500/20 via-pink-500/10 to-purple-500/20',
  dismissible = true,
  showOnce = true,
  onAction,
  className,
}: OfferCardProps) => {
  const storageKey = `swipess_offer_dismissed_${id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showOnce) {
      const dismissed = localStorage.getItem(storageKey);
      setVisible(!dismissed);
    } else {
      setVisible(true);
    }
  }, [storageKey, showOnce]);

  const handleDismiss = () => {
    setVisible(false);
    if (showOnce) {
      localStorage.setItem(storageKey, 'true');
    }
  };

  const Icon = ICONS[icon];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn('overflow-hidden', className)}
        >
          <div className={cn(
            'relative rounded-2xl border border-border/50 overflow-hidden',
            `bg-gradient-to-r ${gradient}`
          )}>
            {/* Animated background shimmer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
              />
            </div>

            <div className="relative p-4 flex items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-white/90" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground leading-tight">{title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{description}</p>
                {onAction && (
                  <button
                    onClick={onAction}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {ctaText}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Dismiss */}
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground/50 hover:text-foreground transition-all shrink-0 self-start"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

OfferCard.displayName = 'OfferCard';
