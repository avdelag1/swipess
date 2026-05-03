
import { cn } from "@/lib/utils"

/**
 * 🛸 Nexus-grade skeleton loading component
 * - Brand-aligned shimmer wave (Orange -> Pink)
 * - GPU-accelerated 60fps motion
 * - Liquid-glass base for premium dashboard feel
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
        // Liquid-glass base
        "bg-white/[0.04] backdrop-blur-[2px]",
        // GPU-accelerated brand shimmer
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer before:bg-gradient-to-r",
        "before:from-transparent before:via-[#FF4D00]/10 before:via-[#EB4898]/15 before:to-transparent",
        "before:opacity-60",
        // Force GPU layer
        "transform-gpu",
        // Pulsing brand glow
        glow && "after:absolute after:inset-0 after:rounded-md after:animate-skeleton-glow after:pointer-events-none shadow-[0_0_25px_rgba(255,77,0,0.1)]",
        className
      )}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      {...props}
    />
  )
}

export { Skeleton }


