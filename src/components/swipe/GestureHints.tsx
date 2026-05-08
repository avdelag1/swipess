import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Ambient gesture affordances for the swipe card.
 *
 * Tiny, breathing, almost-invisible cues that teach the user the
 * available gestures without cluttering the card:
 *
 *  - Right edge, mid-card: vertical chevrons hinting swipe up = like, down = pass.
 *  - Top edge: a thin grab pill suggesting "pull down to close".
 *
 * All elements are pointer-events:none so they never intercept gestures.
 */
export function GestureHints({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      {/* Top-center grab pill — "pull down to close" affordance */}
      <div
        className="absolute left-1/2 -translate-x-1/2 animate-gesture-breathe"
        style={{ top: 10 }}
      >
        <div
          className="rounded-full"
          style={{
            width: 36,
            height: 4,
            background: 'rgba(255,255,255,0.45)',
            boxShadow: '0 0 8px rgba(255,255,255,0.18)',
          }}
        />
      </div>

      {/* Right edge, mid-card: vertical swipe affordance */}
      <div
        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
        style={{
          padding: '8px 4px',
          borderRadius: 999,
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <ChevronUp
          className="animate-gesture-breathe"
          style={{
            width: 14,
            height: 14,
            color: 'rgba(255,255,255,0.85)',
            filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.35))',
            animationDelay: '0s',
          }}
          strokeWidth={2.4}
        />
        <div
          style={{
            width: 3,
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.55)',
          }}
        />
        <ChevronDown
          className="animate-gesture-breathe"
          style={{
            width: 14,
            height: 14,
            color: 'rgba(255,255,255,0.85)',
            filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.35))',
            animationDelay: '0.6s',
          }}
          strokeWidth={2.4}
        />
      </div>
    </div>
  );
}