
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
        "relative overflow-hidden rounded-md bg-muted/80",
        // GPU-accelerated shimmer animation
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer before:bg-gradient-to-r",
        "before:from-transparent before:via-white/15 before:to-transparent",
        // Force GPU layer for smooth 60fps
        "transform-gpu",
        // Pulsing glow effect for premium feel
        glow && "after:absolute after:inset-0 after:rounded-md after:animate-skeleton-glow after:pointer-events-none",
        className
      )}
      style={{
        willChange: 'contents',
        backfaceVisibility: 'hidden',
        ...(glow && {
          boxShadow: '0 0 20px 2px rgba(255,255,255,0.1)',
        }),
      }}
      {...props}
    />
  )
}

export { Skeleton }
