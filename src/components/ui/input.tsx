import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[1.25rem] border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl px-5 py-2.5 text-[15px] font-medium text-foreground shadow-sm transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
          "placeholder:text-muted-foreground/50",
          "hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:shadow-md",
          "focus-visible:outline-none focus-visible:bg-transparent dark:focus-visible:bg-transparent",
          "focus-visible:border-[var(--color-brand-accent-2)] focus-visible:shadow-[0_0_0_4px_rgba(228,0,124,0.15)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
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


