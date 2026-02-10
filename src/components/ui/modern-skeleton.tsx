import { cn } from "@/lib/utils";

interface ModernSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'avatar' | 'text';
}

export function ModernSkeleton({ className, variant = 'default' }: ModernSkeletonProps) {
  const baseClasses = "relative overflow-hidden bg-gradient-to-r from-muted/50 via-muted/70 to-muted/50";
  const shimmerClasses = "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";
  
  const variantClasses = {
    default: "h-4 w-full rounded-lg",
    card: "h-64 w-full rounded-3xl",
    avatar: "h-16 w-16 rounded-full",
    text: "h-3 w-3/4 rounded-md",
  };

  return (
    <div 
      className={cn(
        baseClasses,
        shimmerClasses,
        variantClasses[variant],
        className
      )}
      style={{ 
        backgroundSize: '1000px 100%',
        animation: 'shimmer 2s linear infinite',
        willChange: 'background-position'
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="w-full h-[calc(100vh-200px)] max-h-[700px] rounded-3xl overflow-hidden">
      <ModernSkeleton variant="card" className="h-full" />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/90 to-transparent backdrop-blur-md space-y-3">
        <ModernSkeleton className="h-8 w-2/3" />
        <ModernSkeleton variant="text" />
        <div className="flex gap-4">
          <ModernSkeleton className="h-4 w-16" />
          <ModernSkeleton className="h-4 w-16" />
          <ModernSkeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex items-center gap-4 p-4">
      <ModernSkeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <ModernSkeleton className="h-5 w-32" />
        <ModernSkeleton variant="text" className="w-48" />
      </div>
    </div>
  );
}