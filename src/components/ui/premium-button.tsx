/**
 * PremiumButton - AAA-game-level button with buttery-smooth micro-interactions
 * 
 * Features:
 * - Spring physics on hover/tap for snappy feel
 * - Subtle scale + shadow on hover
 * - Press-down effect on tap
 * - 60fps performance optimizations
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { buttonTapVariants } from '@/utils/premiumAnimations';
import { cn } from '@/lib/utils';

interface PremiumButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
};

const sizeStyles = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg'
};

export function PremiumButton({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className,
  ...props 
}: PremiumButtonProps) {
  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'cursor-pointer select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      variants={buttonTapVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default PremiumButton;

