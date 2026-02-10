/**
 * TRUST SIGNALS COMPONENT
 * 
 * Subtle, professional trust indicators that reassure users
 * without feeling promotional or loud.
 * 
 * Design principles:
 * - Micro, not loud
 * - Reassuring, not promotional
 * - Subtle animations (pulse for verified)
 * - Soft language ("Active recently" not exact times)
 */

import { memo } from 'react';
import { BadgeCheck, Shield, Star, Clock, Camera, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge = memo(({ size = 'md', showLabel = false, className }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="relative">
        <BadgeCheck 
          className={cn(
            sizeClasses[size], 
            'text-blue-500 fill-blue-500/20'
          )} 
        />
        {/* Subtle pulse animation */}
        <div className="absolute inset-0 animate-ping opacity-30">
          <BadgeCheck className={cn(sizeClasses[size], 'text-blue-400')} />
        </div>
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-blue-500">Verified</span>
      )}
    </div>
  );
});

VerifiedBadge.displayName = 'VerifiedBadge';

interface ActivityIndicatorProps {
  lastActiveAt?: string | Date | null;
  className?: string;
}

export const ActivityIndicator = memo(({ lastActiveAt, className }: ActivityIndicatorProps) => {
  if (!lastActiveAt) return null;

  const getActivityLabel = () => {
    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'Online now';
    if (diffHours < 24) return 'Active today';
    if (diffHours < 72) return 'Active recently';
    return null; // Don't show if inactive for too long
  };

  const label = getActivityLabel();
  if (!label) return null;

  const isOnline = label === 'Online now';

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/50'
      )} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
});

ActivityIndicator.displayName = 'ActivityIndicator';

interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RatingDisplay = memo(({ rating, reviewCount, size = 'md', className }: RatingDisplayProps) => {
  if (!rating || rating === 0) return null;

  const confidence = reviewCount && reviewCount > 10 ? 'high' : reviewCount && reviewCount > 3 ? 'medium' : 'low';

  const sizeClasses = {
    sm: { icon: 'w-3.5 h-3.5', text: 'text-xs' },
    md: { icon: 'w-4 h-4', text: 'text-sm' },
    lg: { icon: 'w-5 h-5', text: 'text-base' },
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Star className={cn(
        'fill-amber-400 text-amber-400',
        sizeClasses[size].icon
      )} />
      <span className={cn(
        'font-semibold text-foreground',
        sizeClasses[size].text
      )}>
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className={cn(
          'text-muted-foreground',
          sizeClasses[size].text,
          confidence === 'low' && 'opacity-70'
        )}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
});

RatingDisplay.displayName = 'RatingDisplay';

interface ProfileStrengthProps {
  hasPhotos?: boolean;
  hasBio?: boolean;
  isVerified?: boolean;
  hasResponded?: boolean;
  className?: string;
}

export const ProfileStrength = memo(({ 
  hasPhotos, 
  hasBio, 
  isVerified, 
  hasResponded,
  className 
}: ProfileStrengthProps) => {
  const indicators = [
    { active: hasPhotos, icon: Camera, label: 'Photos' },
    { active: hasBio, icon: MessageCircle, label: 'Bio' },
    { active: isVerified, icon: Shield, label: 'Verified' },
  ].filter(Boolean);

  const activeCount = indicators.filter(i => i.active).length;
  const total = indicators.length;

  if (activeCount === 0) return null;

  const strengthLabel = activeCount === total ? 'Complete profile' : 
    activeCount >= 2 ? 'Good profile' : 'Basic profile';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="flex gap-0.5">
        {indicators.map((indicator, idx) => (
          <div
            key={idx}
            className={cn(
              'w-1.5 h-4 rounded-full transition-colors',
              indicator.active ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{strengthLabel}</span>
    </div>
  );
});

ProfileStrength.displayName = 'ProfileStrength';

interface ResponseTimeBadgeProps {
  avgResponseMinutes?: number;
  className?: string;
}

export const ResponseTimeBadge = memo(({ avgResponseMinutes, className }: ResponseTimeBadgeProps) => {
  if (!avgResponseMinutes || avgResponseMinutes > 1440) return null; // Don't show if >24h

  const getLabel = () => {
    if (avgResponseMinutes < 15) return 'Replies fast';
    if (avgResponseMinutes < 60) return 'Replies within an hour';
    if (avgResponseMinutes < 240) return 'Replies within hours';
    return 'Usually replies';
  };

  const isFast = avgResponseMinutes < 15;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Clock className={cn(
        'w-3.5 h-3.5',
        isFast ? 'text-green-500' : 'text-muted-foreground'
      )} />
      <span className={cn(
        'text-xs',
        isFast ? 'text-green-600' : 'text-muted-foreground'
      )}>
        {getLabel()}
      </span>
    </div>
  );
});

ResponseTimeBadge.displayName = 'ResponseTimeBadge';
