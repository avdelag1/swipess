import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';

/**
 * ⚡ INSTANT NAVIGATION HOOK
 * 
 * Fires navigate() synchronously — no startTransition deferral.
 * Combined with onPointerDown, this gives sub-frame route changes.
 */
export function useAppNavigate() {
  const navigate = useNavigate();

  const appNavigate = (to: string | number, options?: any) => {
    triggerHaptic('light');

    if (typeof to === 'number') {
      navigate(to);
    } else {
      navigate(to, options);
    }
  };

  return { 
    navigate: appNavigate, 
    isPending: false,
    rawNavigate: navigate 
  };
}
