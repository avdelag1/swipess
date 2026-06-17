import { cn } from '@/lib/utils';

export function SpinnerBlock({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-8', className)}>
      <div className="w-10 h-10 rounded-xl border-2 border-primary/15 border-t-primary animate-spin" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

export function MessageListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex gap-3 animate-pulse',
            i % 2 === 0 ? 'justify-start' : 'justify-end flex-row-reverse',
          )}
        >
          <div className="w-9 h-9 rounded-full bg-muted/40 shrink-0" />
          <div
            className={cn(
              'h-12 rounded-2xl bg-muted/30',
              i % 3 === 0 ? 'w-[72%]' : i % 3 === 1 ? 'w-[55%]' : 'w-[40%]',
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function NotificationListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/40 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-muted/40 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted/40 rounded w-2/3" />
            <div className="h-2.5 bg-muted/25 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto animate-pulse">
      <div className="aspect-[3/4] rounded-[2rem] bg-muted/30 mb-4" />
      <div className="h-6 bg-muted/30 rounded-xl w-3/4 mx-auto mb-2" />
      <div className="h-4 bg-muted/20 rounded-lg w-1/2 mx-auto" />
    </div>
  );
}

export function GridCardSkeleton({ count = 6, cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' }: { count?: number; cols?: string }) {
  return (
    <div className={cn('grid gap-6', cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[2rem] overflow-hidden border border-border/30 animate-pulse">
          <div className="aspect-[4/5] bg-muted/30" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-muted/30 rounded-lg w-3/4" />
            <div className="h-3 bg-muted/20 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}