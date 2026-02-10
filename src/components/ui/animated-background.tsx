import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'gradient' | 'mesh' | 'subtle';
}

export const AnimatedBackground = ({
  className,
  children,
  variant = 'gradient'
}: AnimatedBackgroundProps) => {
  const variants = {
    gradient: 'animated-gradient',
    mesh: 'animated-gradient opacity-30',
    subtle: 'animated-gradient opacity-10'
  };

  return (
    <div className={cn('relative min-h-screen', className)}>
      <div
        className={cn(
          'fixed inset-0 -z-10',
          variants[variant]
        )}
      />
      {children}
    </div>
  );
};
