/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest font-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer active:scale-95 transform shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] hover:bg-primary backdrop-blur-md",
        secondary:
          "border-white/5 bg-secondary/70 backdrop-blur-md text-secondary-foreground hover:bg-secondary/90 hover:shadow-lg",
        destructive:
          "border-white/10 bg-destructive/80 backdrop-blur-md text-destructive-foreground hover:bg-destructive shadow-[0_0_15px_rgba(var(--destructive),0.3)]",
        outline: "text-foreground border-border/40 bg-background/40 backdrop-blur-xl hover:border-primary/50 hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }


