import { ReactNode } from 'react';

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full gpu-accelerate">
      {children}
    </div>
  );
}

