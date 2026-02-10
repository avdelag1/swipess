/**
 * USER-FRIENDLY ERROR COMPONENT
 * 
 * Every error must explain:
 * 1. What happened
 * 2. Why
 * 3. What to do next
 * 
 * No raw errors. Ever.
 */

import { memo, ReactNode } from 'react';
import { 
  WifiOff, 
  Heart, 
  CreditCard, 
  ShieldX, 
  Upload,
  RefreshCw,
  Home,
  MessageCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type ErrorType = 
  | 'network'
  | 'like-limit'
  | 'package-required'
  | 'blocked-user'
  | 'upload-failed'
  | 'auth-required'
  | 'rate-limit'
  | 'generic';

interface ErrorConfig {
  icon: ReactNode;
  title: string;
  description: string;
  action: string;
  actionVariant?: 'default' | 'outline' | 'secondary';
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  network: {
    icon: <WifiOff className="w-10 h-10 text-muted-foreground" />,
    title: "You're offline",
    description: "Check your internet connection and try again. Your progress is saved.",
    action: "Try again",
    actionVariant: 'default',
  },
  'like-limit': {
    icon: <Heart className="w-10 h-10 text-pink-400" />,
    title: "Daily likes reached",
    description: "You've used all your free likes today. Come back tomorrow or upgrade for unlimited likes.",
    action: "See upgrade options",
    actionVariant: 'default',
  },
  'package-required': {
    icon: <CreditCard className="w-10 h-10 text-primary" />,
    title: "This feature requires a package",
    description: "Unlock this feature to enhance your experience. See available options.",
    action: "View packages",
    actionVariant: 'default',
  },
  'blocked-user': {
    icon: <ShieldX className="w-10 h-10 text-destructive/70" />,
    title: "User unavailable",
    description: "This user is no longer available for matching. We've removed them from your feed.",
    action: "Continue browsing",
    actionVariant: 'secondary',
  },
  'upload-failed': {
    icon: <Upload className="w-10 h-10 text-muted-foreground" />,
    title: "Upload didn't complete",
    description: "The file couldn't be uploaded. Check your connection and try a smaller file.",
    action: "Try again",
    actionVariant: 'default',
  },
  'auth-required': {
    icon: <Home className="w-10 h-10 text-primary" />,
    title: "Session expired",
    description: "Your session has ended. Sign in again to continue where you left off.",
    action: "Sign in",
    actionVariant: 'default',
  },
  'rate-limit': {
    icon: <Clock className="w-10 h-10 text-amber-500" />,
    title: "Slow down a bit",
    description: "You're moving too fast! Wait a moment before trying again.",
    action: "Got it",
    actionVariant: 'secondary',
  },
  generic: {
    icon: <AlertTriangle className="w-10 h-10 text-muted-foreground" />,
    title: "Something went wrong",
    description: "We couldn't complete that action. Please try again.",
    action: "Try again",
    actionVariant: 'default',
  },
};

interface UserFriendlyErrorProps {
  type: ErrorType;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  className?: string;
  compact?: boolean;
  customTitle?: string;
  customDescription?: string;
}

export const UserFriendlyError = memo(({
  type,
  onAction,
  onSecondaryAction,
  secondaryActionLabel = "Go back",
  className,
  compact = false,
  customTitle,
  customDescription,
}: UserFriendlyErrorProps) => {
  const config = errorConfigs[type];

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50",
        className
      )}>
        <div className="shrink-0 scale-75">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {customTitle || config.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {customDescription || config.description}
          </p>
        </div>
        {onAction && (
          <Button
            size="sm"
            variant={config.actionVariant}
            onClick={onAction}
            className="shrink-0"
          >
            {config.action}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 space-y-6",
      className
    )}>
      <div className="p-4 rounded-full bg-muted/50">
        {config.icon}
      </div>
      
      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-semibold text-foreground">
          {customTitle || config.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {customDescription || config.description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {onAction && (
          <Button
            variant={config.actionVariant}
            onClick={onAction}
            className="flex-1"
          >
            {config.action}
          </Button>
        )}
        {onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            className="flex-1"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

UserFriendlyError.displayName = 'UserFriendlyError';

// Inline error toast helper - for less severe errors
export const getErrorMessage = (error: unknown): { title: string; description: string } => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return { title: "Connection issue", description: "Check your internet and try again." };
    }
    if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('unauthenticated')) {
      return { title: "Session expired", description: "Please sign in again." };
    }
    if (msg.includes('limit') || msg.includes('quota')) {
      return { title: "Limit reached", description: "You've reached your current limit." };
    }
    if (msg.includes('permission') || msg.includes('forbidden')) {
      return { title: "Access denied", description: "You don't have permission for this action." };
    }
    if (msg.includes('duplicate')) {
      return { title: "Already exists", description: "This action was already completed." };
    }
  }
  
  return { title: "Something went wrong", description: "Please try again in a moment." };
};
