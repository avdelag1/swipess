import { Skeleton } from './skeleton';
import { Card } from './card';

/**
 * 🚀 DashboardSkeleton: Premium placeholder for the main discovery/swipe view
 */
/**
 * 🚀 DashboardSkeleton: Premium content-only placeholder
 * Fits perfectly under the persistent Header/Nav for zero-jump loading.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto p-4 space-y-6 animate-pulse">
      {/* Main Swipe Card Placeholder - Full Bleed Design */}
      <Card className="relative flex-1 rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-muted aspect-[3/4] md:aspect-auto">
        <div className="absolute inset-x-5 bottom-12 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl opacity-50" />
        </div>
      </Card>

      {/* Subtle indicator of more content below (Swipe Stack feel) */}
      <div className="h-4 w-full flex justify-center gap-2 opacity-70">
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-2 h-2 rounded-full bg-white/40" />
        <div className="w-2 h-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/**
 * 🚀 ProfileSkeleton: Premium placeholder for profile pages
 */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col h-full w-full space-y-8 p-6 animate-pulse">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-4 pt-4">
        <Skeleton className="w-32 h-32 rounded-full border-4 border-white/5" />
        <div className="space-y-2 text-center">
          <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-32 mx-auto rounded-full" />
        </div>
      </div>

      {/* Stats/Badges */}
      <div className="flex justify-center gap-4 py-2">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-md" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 🚀 MessageSkeleton: Premium placeholder for messaging inbox
 */
export function MessageSkeleton() {
  return (
    <div className="flex flex-col h-full w-full animate-pulse">
      {/* Search/Header */}
      <div className="p-4 border-b border-white/5">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Inbox Items */}
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-white/5">
            <Skeleton className="w-14 h-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-md" />
              </div>
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


