import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/utils/haptics"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none touch-manipulation will-change-transform transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-gradient-button text-white shadow-button hover:shadow-glow hover:shadow-[var(--elevation-floating)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg rounded-3xl",
        outline:
          "border-2 border-primary/20 bg-card/80 backdrop-blur-md text-card-foreground hover:bg-primary hover:text-white hover:border-primary rounded-3xl",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/80 text-foreground shadow-lg hover:shadow-xl backdrop-blur-md rounded-3xl",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground hover:backdrop-blur-md rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-premium text-white shadow-premium premium-glow hover:shadow-glow rounded-3xl",
        tinder: "bg-white/90 backdrop-blur-md text-card-foreground hover:bg-white shadow-card hover:shadow-xl rounded-3xl",
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
