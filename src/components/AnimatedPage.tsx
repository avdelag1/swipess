import { ReactNode } from 'react';
import { useViewTransitions } from '@/hooks/useViewTransitions';

export function AnimatedPage({ children }: { children: ReactNode }) {
  const { isSupported } = useViewTransitions();

  if (isSupported) {
    return (
      <div
        className="h-full w-full view-transition-page"
        style={{
          viewTransitionName: 'swipess-page-content',
          contain: 'layout style paint',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="h-full w-full"
    >
      {children}
    </div>
  );
}
