import { memo } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedOwnerBadgeProps {
  isVerified: boolean;
  isPending?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedOwnerBadge = memo(({ 
  isVerified, 
  isPending = false, 
  size = 'md', 
  showLabel = true,
  className 
}: VerifiedOwnerBadgeProps) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  const labelSize = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  if (!isVerified && !isPending) return null;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full backdrop-blur-sm',
      isVerified 
        ? 'bg-amber-500/15 border border-amber-500/30' 
        : 'bg-muted/50 border border-border/50',
      className
    )}>
      {isVerified ? (
        <ShieldCheck className={cn(sizeClasses[size], 'text-amber-500')} />
      ) : (
        <Clock className={cn(sizeClasses[size], 'text-muted-foreground')} />
      )}
      {showLabel && (
        <span className={cn(
          labelSize[size], 
          'font-semibold',
          isVerified ? 'text-amber-500' : 'text-muted-foreground'
        )}>
          {isVerified ? 'Verified Owner' : 'Verification Pending'}
        </span>
      )}
    </div>
  );
});

VerifiedOwnerBadge.displayName = 'VerifiedOwnerBadge';


