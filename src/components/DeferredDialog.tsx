import { ReactNode, useRef } from 'react';
import { SmartSuspense } from '@/components/SmartSuspense';

interface DeferredDialogProps {
  when: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  /**
   * Once it has been opened, keep the children mounted even after `when` flips
   * back to false. Required for dialogs that play an exit / close animation via
   * their own <AnimatePresence>: otherwise closing flips `when` to false and the
   * dialog is torn out of the tree synchronously, so the exit animation never
   * runs (you only ever see the open animation). The child should drive its own
   * show/hide off the same boolean (e.g. an `isOpen` prop) so it can animate out
   * while staying mounted. Defaults to false to preserve deferred-mount behaviour
   * for dialogs that don't animate on close.
   */
  keepMounted?: boolean;
}

export const DeferredDialog = ({
  when,
  children,
  fallback = null,
  threshold,
  keepMounted = false,
}: DeferredDialogProps) => {
  const hasOpenedRef = useRef(false);
  if (when) hasOpenedRef.current = true;

  // With keepMounted, stay rendered after the first open so the child can play
  // its own exit animation; otherwise mount only while `when` is true.
  const shouldRender = keepMounted ? hasOpenedRef.current : when;
  if (!shouldRender) return null;

  return (
    <SmartSuspense fallback={fallback} threshold={threshold}>
      {children}
    </SmartSuspense>
  );
};
