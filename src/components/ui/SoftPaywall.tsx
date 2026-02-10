/**
 * SOFT PAYWALL COMPONENTS
 * 
 * Never say "No". Say "Yes, if…"
 * 
 * Design principles:
 * - Let users try, then stop them
 * - Preview locked features
 * - Contextual upgrade prompts (not random modals)
 * - Show value before asking for upgrade
 */

import { memo, ReactNode } from 'react';
import { Lock, Sparkles, Eye, Undo2, CheckCheck, Zap } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FeaturePreviewProps {
  children: ReactNode;
  isLocked: boolean;
  featureName: string;
  description: string;
  onUpgrade?: () => void;
  blurAmount?: 'light' | 'medium' | 'heavy';
  className?: string;
}

export const FeaturePreview = memo(({
  children,
  isLocked,
  featureName,
  description,
  onUpgrade,
  blurAmount = 'medium',
  className,
}: FeaturePreviewProps) => {
  const blurValues = {
    light: 'blur-[2px]',
    medium: 'blur-[4px]',
    heavy: 'blur-[8px]',
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Blurred preview */}
      <div className={cn("pointer-events-none select-none", blurValues[blurAmount])}>
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm p-4">
        <div className="p-3 rounded-full bg-primary/10 mb-3">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">{featureName}</h4>
        <p className="text-xs text-muted-foreground text-center max-w-[200px] mb-4">
          {description}
        </p>
        {onUpgrade && (
          <Button size="sm" onClick={onUpgrade} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Unlock
          </Button>
        )}
      </div>
    </div>
  );
});

FeaturePreview.displayName = 'FeaturePreview';

interface LockedFeatureTooltipProps {
  feature: 'read-receipts' | 'typing-indicator' | 'undo-swipe' | 'super-like' | 'boost';
  onUpgrade?: () => void;
  className?: string;
}

const featureInfo = {
  'read-receipts': {
    icon: CheckCheck,
    title: 'Read Receipts',
    description: 'See when your messages are read',
  },
  'typing-indicator': {
    icon: Eye,
    title: 'Typing Indicator',
    description: 'See when someone is typing',
  },
  'undo-swipe': {
    icon: Undo2,
    title: 'Undo Swipe',
    description: 'Take back accidental swipes',
  },
  'super-like': {
    icon: Sparkles,
    title: 'Super Like',
    description: 'Stand out from the crowd',
  },
  'boost': {
    icon: Zap,
    title: 'Boost Profile',
    description: 'Get more visibility',
  },
};

export const LockedFeatureTooltip = memo(({
  feature,
  onUpgrade,
  className,
}: LockedFeatureTooltipProps) => {
  const info = featureInfo[feature];
  const Icon = info.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className={cn(
        "absolute z-50 p-3 rounded-xl bg-card border border-border shadow-lg min-w-[180px]",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-medium text-foreground">{info.title}</span>
            <Lock className="w-3 h-3 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
          {onUpgrade && (
            <Button size="sm" variant="outline" onClick={onUpgrade} className="h-7 text-xs w-full">
              Upgrade to unlock
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

LockedFeatureTooltip.displayName = 'LockedFeatureTooltip';

interface TrialLimitBannerProps {
  current: number;
  limit: number;
  featureName: string;
  onUpgrade?: () => void;
  className?: string;
}

export const TrialLimitBanner = memo(({
  current,
  limit,
  featureName,
  onUpgrade,
  className,
}: TrialLimitBannerProps) => {
  const remaining = limit - current;
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  if (isAtLimit) {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className={cn(
          "p-4 rounded-xl bg-primary/10 border border-primary/20",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              You've used all your {featureName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upgrade to continue with unlimited access
            </p>
          </div>
          {onUpgrade && (
            <Button size="sm" onClick={onUpgrade} className="shrink-0 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  if (isNearLimit) {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className={cn(
          "p-3 rounded-xl bg-amber-500/10 border border-amber-500/20",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">{remaining}</span> {featureName} remaining today
          </p>
          {onUpgrade && (
            <Button size="sm" variant="ghost" onClick={onUpgrade} className="shrink-0 text-amber-600">
              Get more
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
});

TrialLimitBanner.displayName = 'TrialLimitBanner';
