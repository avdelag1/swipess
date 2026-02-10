import { useRadio } from '@/contexts/RadioContext';

/**
 * Hook for components to interact with the global radio player.
 * Now acts as a proxy to RadioContext to maintain backward compatibility
 * while ensuring playback persists across navigation.
 */
export function useRadioPlayer() {
  return useRadio();
}
