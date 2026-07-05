import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md px-4 py-2.5 text-base text-foreground shadow-sm",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/60",
          "hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10",
          "focus-visible:outline-none focus-visible:border-primary/50 focus-visible:bg-transparent",
          "focus-visible:shadow-[0_0_0_2px_rgba(var(--primary),0.2)]",
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


