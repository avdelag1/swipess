import { memo } from 'react';

/**
 * Premium content-aware skeleton that mirrors the real SimpleSwipeCard layout.
 * Uses CSS-only animations (no JS, no framer-motion) for zero-overhead rendering.
 */
export const SimpleSwipeCardSkeleton = memo(() => {
  return (
    <div className="absolute inset-0 flex flex-col p-0">
      <div className="flex-1 relative rounded-[32px] overflow-hidden bg-[#0a0a0c] border border-white/[0.06]" style={{ contain: 'layout size style paint' }}>
        {/* Multi-layer shimmer */}
        <div className="absolute inset-0 z-10">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
              backgroundSize: '200% 200%',
              animation: 'skeleton-shimmer 2s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.6) 100%)',
            }}
          />
        </div>

        {/* Photo position indicator dots (top) */}
        <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex-1 h-[2px] rounded-full"
              style={{
                background: n === 1 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>

        {/* Verified badge skeleton (top-left) */}
        <div className="absolute left-6 z-30" style={{ top: 'calc(var(--safe-top, 0px) + var(--top-bar-height, 72px) + 66px)' }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-12 h-2 rounded bg-white/[0.08]" />
          </div>
        </div>

        {/* Rating skeleton */}
        <div className="absolute left-5 z-30" style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 130px)' }}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
            <div className="w-3 h-3 rounded bg-white/10" />
            <div className="w-8 h-2.5 rounded bg-white/[0.08]" />
          </div>
        </div>

        {/* Card info skeleton (bottom) */}
        <div className="absolute left-5 right-5 z-30" style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 16px)' }}>
          <div
            className="inline-flex flex-col w-fit max-w-full px-4 py-3 rounded-3xl space-y-2.5"
            style={{
              background: 'rgba(20, 20, 24, 0.55)',
              boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.55)',
            }}
          >
            {/* Title line */}
            <div className="flex items-baseline gap-2">
              <div className="h-6 w-44 rounded-lg bg-white/10 skeleton-pulse" />
              <div className="h-5 w-10 rounded bg-white/[0.08] skeleton-pulse" style={{ animationDelay: '0.1s' }} />
            </div>
            {/* Price line */}
            <div className="h-7 w-32 rounded-lg bg-white/10 skeleton-pulse" style={{ animationDelay: '0.15s' }} />
            {/* Detail badges */}
            <div className="flex gap-2">
              <div className="h-4 w-16 rounded-full bg-white/[0.06] skeleton-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="h-4 w-14 rounded-full bg-white/[0.06] skeleton-pulse" style={{ animationDelay: '0.25s' }} />
              <div className="h-4 w-20 rounded-full bg-white/[0.06] skeleton-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            {/* Snippet line */}
            <div className="h-3.5 w-48 rounded bg-white/[0.05] skeleton-pulse" style={{ animationDelay: '0.35s' }} />
          </div>
        </div>

        {/* Right-side action rail skeleton */}
        <div className="absolute right-3 z-30 flex flex-col gap-2.5 items-center" style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 24px)' }}>
          {/* Map button */}
          <div className="w-[52px] h-[52px] rounded-full bg-white/[0.06] border border-white/[0.08] skeleton-pulse" />
          {/* Action rail group */}
          <div className="flex flex-col gap-1 p-1.5 rounded-3xl bg-white/[0.04] border border-white/[0.06]">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="w-[44px] h-[44px] rounded-full bg-white/[0.05] skeleton-pulse"
                style={{ animationDelay: `${n * 0.08}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

SimpleSwipeCardSkeleton.displayName = 'SimpleSwipeCardSkeleton';
