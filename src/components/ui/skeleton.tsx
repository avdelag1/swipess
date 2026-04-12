
import { cn } from "@/lib/utils"

/**
 * iOS-grade skeleton loading component with smooth shimmer animation
 * - Faster 1.2s duration for snappy feel (was 2s)
 * - GPU-accelerated via translateZ(0)
 * - Subtle gradient for professional look
 * - Premium pulsing glow effect for enhanced visual feedback
 */
function Skeleton({
  className,
  glow = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        glow ? "liquid-glass-shimmer" : "bg-muted/40 animate-pulse",
        // Force GPU layer for smooth 60fps
        "transform-gpu translate-z-0",
        className
      )}
      style={{
        backfaceVisibility: 'hidden',
        ...(glow && {
          boxShadow: '0 8px 32px 0 rgba(236, 72, 153, 0.15)',
        }),
      }}
      {...props}
    />
  )
}

export { Skeleton }
