import { useNavigate } from 'react-router-dom';
import { useTransition } from 'react';
import { triggerHaptic } from '@/utils/haptics';

/**
 * ⚡ INSTANT NAVIGATION HOOK
 * 
 * Fires navigate() synchronously — no startTransition deferral.
 * Combined with onPointerDown, this gives sub-frame route changes.
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const appNavigate = (to: string | number, options?: any) => {
    triggerHaptic('light');

    startTransition(() => {
      if (typeof to === 'number') {
        navigate(to);
      } else {
        navigate(to, options);
      }
    });
  };

  return { 
    navigate: appNavigate, 
    isPending,
    rawNavigate: navigate 
  };
}
