import { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  triggered: boolean;
}

/**
 * Visual indicator for pull-to-refresh — shows a spinner
 * that scales and rotates based on pull distance.
 */
export const PullToRefreshIndicator = memo(({ pullDistance, isRefreshing, triggered }: Props) => {
  if (pullDistance <= 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / 80, 1);
  const rotation = pullDistance * 3;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${isRefreshing ? 40 : pullDistance}px)`,
        transition: isRefreshing ? 'transform 300ms ease' : 'none',
        opacity: Math.min(progress * 1.5, 1),
      }}
    >
      <div
        className={`w-9 h-9 rounded-full bg-background/95 backdrop-blur-md shadow-lg border border-border flex items-center justify-center ${
          isRefreshing ? 'animate-spin' : ''
        }`}
        style={
          !isRefreshing
            ? {
                transform: `scale(${0.5 + progress * 0.5}) rotate(${rotation}deg)`,
              }
            : undefined
        }
      >
        <Loader2
          className={`w-4 h-4 ${triggered || isRefreshing ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </div>
    </div>
  );
});

PullToRefreshIndicator.displayName = 'PullToRefreshIndicator';

