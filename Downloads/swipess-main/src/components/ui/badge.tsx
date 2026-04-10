import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer active:scale-95 transform",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-600 backdrop-blur-sm",
        secondary:
          "border-transparent bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary/90 shadow-md hover:shadow-lg",
        destructive:
          "border-transparent bg-destructive/80 backdrop-blur-sm text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg",
        outline: "text-foreground border-border/50 bg-background/60 backdrop-blur-sm hover:border-primary hover:bg-primary/15 hover:text-primary shadow-sm hover:shadow-md",
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
