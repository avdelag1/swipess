import { ReactNode } from 'react';
import { SmartSuspense } from '@/components/SmartSuspense';

interface DeferredDialogProps {
  when: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
}

export const DeferredDialog = ({
  when,
  children,
  fallback = null,
  threshold,
}: DeferredDialogProps) => {
  if (!when) return null;

  return (
    <SmartSuspense fallback={fallback} threshold={threshold}>
      {children}
    </SmartSuspense>
  );
};
