import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/utils/haptics"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold focus-visible:outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none touch-manipulation will-change-transform transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 text-white shadow-xl hover:bg-zinc-900 border-b-2 border-zinc-800",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-lg rounded-3xl border-b-2 border-red-800",
        outline:
          "border-2 border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 rounded-3xl shadow-sm",
        secondary:
          "bg-zinc-100 text-zinc-900 shadow-md hover:bg-zinc-200 rounded-3xl border-b-2 border-zinc-200",
        ghost: "hover:bg-zinc-100 hover:text-zinc-900 rounded-2xl",
        link: "text-zinc-900 underline-offset-4 hover:underline",
        premium: "bg-gradient-premium text-white shadow-premium premium-glow hover:shadow-glow rounded-3xl border-b-2 border-purple-800",
        tinder: "bg-white text-zinc-950 hover:bg-zinc-50 shadow-xl rounded-3xl border border-zinc-200",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Use elastic wobbly spring on press instead of subtle scale */
  elastic?: boolean
}

const elasticTap = {
  scale: 0.92,
  transition: { type: "spring" as const, stiffness: 500, damping: 12, mass: 0.6 }
};

const subtleTap = {
  scale: 0.96,
  transition: { type: "spring" as const, stiffness: 600, damping: 20, mass: 0.4 }
};

const hoverLift = {
  scale: 1.03,
  y: -1,
  transition: { type: "spring" as const, stiffness: 400, damping: 18, mass: 0.5 }
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, elastic = false, onClick, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            triggerHaptic('light');
            onClick?.(e);
          }}
          {...props}
        />
      );
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileTap={elastic ? elasticTap : subtleTap}
        whileHover={hoverLift}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          triggerHaptic('light');
          onClick?.(e);
        }}
        {...(props as any)}
      />
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
