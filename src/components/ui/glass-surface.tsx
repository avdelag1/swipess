import * as React from "react";
import { cn } from "@/lib/utils";

type Elevation = "surface" | "elevated" | "floating" | "modal";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  /** Disable backdrop blur (auto-disabled on mobile via CSS) */
  noBlur?: boolean;
}

const elevationMap: Record<Elevation, string> = {
  surface: "shadow-[var(--elevation-surface)]",
  elevated: "shadow-[var(--elevation-elevated)]",
  floating: "shadow-[var(--elevation-floating)]",
  modal: "shadow-[var(--elevation-modal)]",
};

const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ className, elevation = "elevated", noBlur = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] border border-[var(--glass-border)]",
          "bg-[var(--glass-bg)]",
          !noBlur && "backdrop-blur-[var(--glass-blur)]",
          elevationMap[elevation],
          // Soft internal highlight on top edge
          "relative overflow-hidden",
          "transition-shadow duration-[var(--duration-normal)] ease-[var(--ease-smooth)]",
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
