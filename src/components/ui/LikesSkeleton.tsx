import { Skeleton } from './skeleton';

/**
 * Content-shaped skeleton for likes/favorites grid pages.
 * Matches the PremiumLikedCard layout for zero-jump loading.
 */
export function LikesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[2rem] overflow-hidden border border-border/20">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Content-shaped skeleton for owner interested/liked clients list.
 */
export function ClientListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-border/20">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}


