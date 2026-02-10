import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/utils/haptics"

const buttonVariants = cva(
  // iOS-grade button with instant feedback
  // - 50ms transition for instant feel (iOS standard)
  // - scale(0.97) for subtle press (not aggressive 0.92)
  // - No hover:scale on touch devices (iOS-like)
  // - Cubic-bezier for iOS spring physics
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-transform duration-75 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] select-none touch-manipulation will-change-transform transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-gradient-button text-white shadow-button hover:shadow-glow",
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
}

// Inline ripple effect to avoid hook context issues
const createRipple = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();

  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const ripple = button.getElementsByClassName('ripple')[0];
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 400);
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Instant haptic feedback for game-like feel
      triggerHaptic('light')
      createRipple(e)
      onClick?.(e)
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
