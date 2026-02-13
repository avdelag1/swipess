import * as React from "react";
import { cn } from "@/lib/utils";

type Elevation = "surface" | "elevated" | "floating" | "modal";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  /** Disable backdrop blur (auto-disabled on mobile via CSS) */
  noBlur?: boolean;
}

const elevationMap: Record<Elevation, string> = {
  surface: "shadow-[var(--shadow-soft-sm)]",
  elevated: "shadow-[var(--shadow-soft-md)]",
  floating: "shadow-[var(--shadow-soft-lg)]",
  modal: "shadow-[var(--shadow-soft-lg)]",
};

// Enhanced blur levels for premium glassmorphism
const blurMap: Record<Elevation, string> = {
  surface: "backdrop-blur-[var(--glass-blur)]",
  elevated: "backdrop-blur-[var(--glass-blur-md)]",
  floating: "backdrop-blur-[var(--glass-blur-lg)]",
  modal: "backdrop-blur-[var(--glass-blur-xl)]",
};

const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ className, elevation = "elevated", noBlur = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] border border-[var(--glass-border)]",
          "bg-[var(--glass-bg)]",
          !noBlur && blurMap[elevation],
          elevationMap[elevation],
          // Soft internal highlight on top edge
          "relative overflow-hidden",
          "transition-all duration-[var(--duration-normal)] ease-[var(--ease-smooth)]",
          className
        )}
        {...props}
      >
        {/* Top highlight edge */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-[var(--glass-highlight)] pointer-events-none"
          aria-hidden="true"
        />
        {children}
      </div>
    );
  }
);

GlassSurface.displayName = "GlassSurface";

export { GlassSurface };
export type { GlassSurfaceProps, Elevation };
