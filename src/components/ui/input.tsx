import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-base text-foreground",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/50",
          "hover:border-foreground/20",
          "focus-visible:outline-none focus-visible:border-primary/40",
          "focus-visible:shadow-[0_0_0_3px_rgba(from_var(--primary)_r_g_b_/_0.10),inset_0_1px_3px_rgba(0,0,0,0.05)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-[border-color,box-shadow,background-color] duration-150",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }


