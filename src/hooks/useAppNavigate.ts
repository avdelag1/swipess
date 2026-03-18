import { useNavigate } from 'react-router-dom';
import { useTransition } from 'react';
import { triggerHaptic } from '@/utils/haptics';

/**
 * ⚡ INSTANT NAVIGATION HOOK
 * 
 * Uses React 18 startTransition to perform background navigation.
 * This prevents the "Suspense Flicker" and keeps the current page interactive
 * while the next lazy-loaded chunk is being fetched.
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const appNavigate = (to: string | number, options?: any) => {
    // Provide immediate physical feedback
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
    // Original navigate for urgent updates
    rawNavigate: navigate 
  };
}
